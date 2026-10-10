// SIMANTAB telemetry transport - staging only until independently verified.
// Do not store question answers, passwords or access tokens in telemetry events.
export const TELEMETRY_EVENT_TYPES=Object.freeze([
  'SESSION_START','QUESTION_ENTER','QUESTION_LEAVE','ANSWER_CHANGE',
  'VISIBILITY_HIDDEN','VISIBILITY_VISIBLE','WINDOW_BLUR','WINDOW_FOCUS','SESSION_SUBMIT'
]);
const EVENT_SET=new Set(TELEMETRY_EVENT_TYPES);
const expectedUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateTelemetryEvent(event) {
  if(!event||typeof event!=='object'||Array.isArray(event))return {ok:false,reason:'INVALID_ROW'};
  if(!EVENT_SET.has(event.event_type))return {ok:false,reason:'UNKNOWN_EVENT_TYPE'};
  if(!expectedUuid.test(String(event.attempt_id||''))||!expectedUuid.test(String(event.user_id||'')))
    return {ok:false,reason:'INVALID_IDENTIFIERS'};
  if(event.question_no!=null&&(!Number.isInteger(event.question_no)||event.question_no<1||event.question_no>3000))
    return {ok:false,reason:'QUESTION_OUT_OF_RANGE'};
  if(event.display_no!=null&&(!Number.isInteger(event.display_no)||event.display_no<1||event.display_no>70))
    return {ok:false,reason:'DISPLAY_OUT_OF_RANGE'};
  for(const field of ['away_seconds','dwell_seconds','after_return_seconds']) {
    const value=event[field];
    if(value!=null&&(!Number.isInteger(value)||value<0||value>7200))
      return {ok:false,reason:'DURATION_OUT_OF_RANGE'};
  }
  if(event.revision!==undefined&&typeof event.revision!=='boolean')return {ok:false,reason:'INVALID_REVISION'};
  if(typeof event.client_ts!=='string'||!Number.isFinite(Date.parse(event.client_ts)))
    return {ok:false,reason:'INVALID_TIMESTAMP'};
  if(event.metadata!=null&&(typeof event.metadata!=='object'||Array.isArray(event.metadata)))
    return {ok:false,reason:'INVALID_METADATA'};
  return {ok:true};
}

export function createTelemetryDelivery({
  send,
  onDiagnostic=()=>{},
  delay=(callback,ms)=>setTimeout(callback,ms),
  cancel=(id)=>clearTimeout(id),
  maxPending=128,
  batchSize=24,
  idleDelayMs=1500
}={}) {
  if(typeof send!=='function')throw new TypeError('A batch sender is required');
  if(!Number.isInteger(maxPending)||maxPending<1)throw new TypeError('maxPending must be positive');
  if(!Number.isInteger(batchSize)||batchSize<1)throw new TypeError('batchSize must be positive');
  const queued=[];
  const count={accepted:0,sent:0,rejected:0,overflow:0,retries:0,permanentErrors:0};
  let scheduled=null,flight=null,blocked=false,consecutiveFailures=0;
  const diagnostic=(kind,extras={})=>{
    try{onDiagnostic({kind,pending:queued.length,...extras})}catch{}
  };
  const clear=()=>{if(scheduled!==null){cancel(scheduled);scheduled=null}};
  const schedule=(milliseconds)=>{
    if(blocked||scheduled!==null||!queued.length)return;
    scheduled=delay(()=>{
      scheduled=null;
      // Retry is best effort. It never blocks a user's answer or examination timer.
      flush().catch(()=>{});
    },milliseconds);
  };
  const isPermanent=(error)=>{
    const status=Number(error?.status||error?.code||error?.response?.status);
    return Number.isInteger(status)&&status>=400&&status<500&&![408,425,429].includes(status);
  };
  function add(event) {
    const validation=validateTelemetryEvent(event);
    if(!validation.ok){
      count.rejected++;
      diagnostic('INVALID_EVENT',{reason:validation.reason});
      return false;
    }
    if(queued.length>=maxPending){
      count.overflow++;
      diagnostic('BUFFER_FULL');
      return false;
    }
    queued.push(event);
    count.accepted++;
    if(!blocked)schedule(queued.length>=8?0:idleDelayMs);
    return true;
  }
  async function flush() {
    if(flight)return flight;
    if(blocked)return {sent:0,pending:queued.length,blocked:true};
    clear();
    if(!queued.length)return {sent:0,pending:0};
    flight=(async()=>{
      let sent=0;
      while(queued.length){
        const batch=queued.slice(0,batchSize);
        try {
          await send(batch);
          queued.splice(0,batch.length);
          count.sent+=batch.length;
          sent+=batch.length;
          consecutiveFailures=0;
        }catch(error){
          // HTTP 400 validation failures are not network errors.
          // Retrying unchanged invalid rows would only flood production logs.
          if(isPermanent(error)){
            blocked=true;
            count.permanentErrors++;
            diagnostic('PERMANENT_HTTP_ERROR',{status:Number(error?.status||error?.code||error?.response?.status)});
            return {sent,pending:queued.length,blocked:true};
          }
          consecutiveFailures++;
          count.retries++;
          const retryDelay=Math.min(30000,1000*2**Math.min(5,consecutiveFailures-1));
          diagnostic('TRANSIENT_ERROR',{retryInMs:retryDelay});
          schedule(retryDelay);
          return {sent,pending:queued.length,retrying:true};
        }
      }
      return {sent,pending:0};
    })().finally(()=>{flight=null});
    return flight;
  }
  function diagnostics(){
    return {...count,pending:queued.length,blocked};
  }
  function close() {clear()}
  return {add,flush,diagnostics,close};
}
