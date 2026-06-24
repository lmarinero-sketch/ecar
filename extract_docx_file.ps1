Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\lucas\Desktop\Proyectos\Ecar\2 - ECAR_Procedimiento_Gerencia_Proyectos_Presupuestos_v2_Premium.docx')
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlStr = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$xml = [xml]$xmlStr
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $xml.SelectNodes('//w:p', $ns)
$outText = ''
foreach ($p in $paragraphs) {
    $pText = ''
    $texts = $p.SelectNodes('.//w:t', $ns)
    if ($texts -ne $null) {
        foreach ($t in $texts) {
            $pText += $t.InnerText
        }
    }
    if ($pText -ne '') {
        $outText += $pText + "`n"
    }
}
Set-Content -Path 'C:\Users\lucas\Desktop\Proyectos\Ecar\docx_text.txt' -Value $outText -Encoding UTF8
