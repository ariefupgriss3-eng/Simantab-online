/* Premium Two v1.0 QA gate. Jalankan sebelum bank di-merge ke production. */
export const PREMIUM_TWO_QA_LIMITS={
  total_items:70,
  options_per_item:5,
  key_count_each:14,
  max_adjacent_same_key:0,
  max_strong_length_clue_ratio:0.15,
  max_strong_lexical_cue_ratio:0.15,
  max_option_word_ratio:2.8
};

export const PREMIUM_TWO_CUE_TERMS=[
  "data","bukti","evaluasi","menganalisis","analisis","dampak","kebutuhan",
  "prioritas","berkelanjutan","konsisten","memetakan","menilai","memastikan",
  "berdasarkan","risiko","tujuan","indikator"
];

function words(s=""){return String(s).trim().split(/\s+/).filter(Boolean).length}
function cues(s=""){
  const t=(" "+String(s).toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi," ")+" ");
  return PREMIUM_TWO_CUE_TERMS.reduce((n,x)=>n+(t.includes(" "+x+" ")?1:0),0);
}

/**
 * items: [{id, options:{A,B,C,D,E}, db:{A:1..5,...}}]
 */
export function auditPremiumTwo(items){
  const L=["A","B","C","D","E"],issues=[];
  if(!Array.isArray(items)||items.length!==70)issues.push("Jumlah butir harus tepat 70.");
  const keyCounts={A:0,B:0,C:0,D:0,E:0};
  let prev=null,adjacent=0,strongLength=0,strongCue=0,maxRatio=0;
  for(const item of (items||[])){
    const opts=item?.options||{},db=item?.db||{};
    if(L.some(x=>typeof opts[x]!=="string"))issues.push(`Butir ${item?.id}: opsi A-E tidak lengkap.`);
    if(L.some(x=>![1,2,3,4,5].includes(Number(db[x]))))issues.push(`Butir ${item?.id}: DB map tidak lengkap.`);
    const key=L.find(x=>Number(db[x])===5);
    if(!key){issues.push(`Butir ${item?.id}: DB5 tidak ditemukan.`);continue}
    keyCounts[key]++;
    if(prev===key)adjacent++;
    prev=key;
    const lens=L.map(x=>words(opts[x]));
    const max=Math.max(...lens),min=Math.max(1,Math.min(...lens));
    maxRatio=Math.max(maxRatio,max/min);
    const keyLen=lens[L.indexOf(key)];
    const secondLen=Math.max(...lens.filter((_,j)=>L[j]!==key));
    if(keyLen-secondLen>=3)strongLength++;
    const cs=L.map(x=>cues(opts[x])),keyCue=cs[L.indexOf(key)];
    const secondCue=Math.max(...cs.filter((_,j)=>L[j]!==key));
    if(keyCue-secondCue>=2)strongCue++;
  }
  for(const l of L)if(keyCounts[l]!==14)issues.push(`Distribusi kunci ${l} harus 14, saat ini ${keyCounts[l]}.`);
  const denom=Math.max(1,(items||[]).length);
  if(adjacent>0)issues.push(`Ada ${adjacent} pasangan kunci berturut-turut yang sama.`);
  if(strongLength/denom>PREMIUM_TWO_QA_LIMITS.max_strong_length_clue_ratio)
    issues.push(`DB5 lebih panjang ≥3 kata pada ${strongLength}/${denom} butir, melewati batas QA.`);
  if(strongCue/denom>PREMIUM_TWO_QA_LIMITS.max_strong_lexical_cue_ratio)
    issues.push(`DB5 memiliki clue lexical kuat pada ${strongCue}/${denom} butir, melewati batas QA.`);
  if(maxRatio>PREMIUM_TWO_QA_LIMITS.max_option_word_ratio)
    issues.push(`Rasio panjang opsi maksimum ${maxRatio.toFixed(2)} melewati batas QA.`);
  return {ok:issues.length===0,issues,metrics:{keyCounts,adjacent,strongLength,strongCue,maxOptionWordRatio:maxRatio}};
}
