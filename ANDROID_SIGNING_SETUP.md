# SIMANTAB Android Signing Setup

The Android release workflow must use one permanent upload keystore for every release.

## Required GitHub Actions Secrets

Configure these repository secrets before running **Build SIMANTAB Android AAB**:

- `SIMANTAB_KEYSTORE_B64` — base64-encoded contents of the permanent `simantab-upload-key.jks`
- `SIMANTAB_KEYSTORE_PASSWORD` — keystore password
- `SIMANTAB_KEY_ALIAS` — key alias, recommended `simantab`
- `SIMANTAB_KEY_PASSWORD` — private key password

Do not commit the keystore, passwords, README files containing passwords, or plaintext secret files to the repository.

## Create the permanent keystore once

Example command on a trusted computer:

```bash
keytool -genkeypair -v \
  -keystore simantab-upload-key.jks \
  -alias simantab \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=SIMANTAB, OU=Disdikbud Batang, O=Disdikbud Kabupaten Batang, L=Batang, ST=Jawa Tengah, C=ID"
```

Choose strong, unique passwords and keep an offline backup of the `.jks` file and credentials.

## Encode the keystore

Linux/macOS:

```bash
base64 < simantab-upload-key.jks | tr -d '\n'
```

Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("simantab-upload-key.jks"))
```

Save the resulting string as the `SIMANTAB_KEYSTORE_B64` GitHub Actions Secret.

## Release process

1. Confirm all four repository secrets are configured.
2. Open GitHub Actions.
3. Run **Build SIMANTAB Android AAB** manually.
4. Download only `app-release.aab` from the artifact.
5. Use this same permanent upload key for every future SIMANTAB release.

The workflow intentionally does not generate a new key, does not publish the keystore as an artifact, and fails if signing secrets are missing.
