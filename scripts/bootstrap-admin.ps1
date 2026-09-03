param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$baseUrl = $Url.TrimEnd('/')
if (-not ($baseUrl.StartsWith('https://') -or $baseUrl.StartsWith('http://localhost'))) {
  throw 'Use uma URL HTTPS ou localhost.'
}

$email = Read-Host 'E-mail do administrador'
$nome = Read-Host 'Nome do administrador'
$tokenSeguro = Read-Host 'ADMIN_BOOTSTRAP_TOKEN' -AsSecureString
$senhaSegura = Read-Host 'Senha forte do administrador' -AsSecureString

$email = $email.Trim().ToLowerInvariant()
$nome = $nome.Trim()
if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$' -or $email.Length -gt 254) {
  throw 'E-mail invalido. Digite, por exemplo, pedro.valente@fiemg.com.br, sem barra antes do @.'
}
if ($nome.Length -lt 2 -or $nome.Length -gt 255) {
  throw 'O nome deve possuir entre 2 e 255 caracteres.'
}

$tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSeguro)
$senhaPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
  $senha = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($senhaPtr)
  if ($token.Length -lt 32) {
    throw 'ADMIN_BOOTSTRAP_TOKEN deve possuir pelo menos 32 caracteres.'
  }
  if ($senha.Length -lt 10 -or $senha.Length -gt 128 -or
      $senha -cnotmatch '[a-z]' -or $senha -cnotmatch '[A-Z]' -or
      $senha -notmatch '\d' -or $senha -notmatch '[^A-Za-z0-9]') {
    throw 'A senha deve ter entre 10 e 128 caracteres, com maiuscula, minuscula, numero e simbolo.'
  }
  $headers = @{ 'x-bootstrap-token' = $token }
  $body = @{ email = $email; nome = $nome; senha = $senha } | ConvertTo-Json

  $response = Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/bootstrap-admin" `
    -Method Post `
    -Headers $headers `
    -ContentType 'application/json' `
    -Body $body

  $response | ConvertTo-Json
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($senhaPtr)
  Remove-Variable token, senha, body -ErrorAction SilentlyContinue
}
