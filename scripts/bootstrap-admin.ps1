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

$tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSeguro)
$senhaPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
  $senha = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($senhaPtr)
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
