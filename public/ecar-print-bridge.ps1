# ==============================================================================
# ECAR ERP - Puente Local de Impresion Termica ESC/POS (58mm RAW para Windows)
# ==============================================================================
# Como usar:
# 1. Haga clic derecho sobre este archivo -> "Ejecutar con PowerShell"
#    (o ejecute en PowerShell: powershell -ExecutionPolicy Bypass -File .\ecar-print-bridge.ps1)
# 2. Deje esta ventana abierta (minimizada) mientras usa ECAR ERP.
# 3. Cada vez que presione "Ticket 58mm" en ECAR, saldra directo en ESC/POS nativo.
# ==============================================================================

$ErrorActionPreference = "Stop"

# Cargar Winspool API para enviar bytes RAW directo al spooler de Windows
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "ECAR Ticket 58mm ESC/POS";
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) return false;
        try {
            if (!StartDocPrinter(hPrinter, 1, di)) return false;
            try {
                if (!StartPagePrinter(hPrinter)) return false;
                try {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten = 0;
                    bool ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    return ok;
                } finally {
                    EndPagePrinter(hPrinter);
                }
            } finally {
                EndDocPrinter(hPrinter);
            }
        } finally {
            ClosePrinter(hPrinter);
        }
    }
}
"@

# Detectar impresora termica automaticamente o usar la predeterminada
$printers = Get-Printer | Select-Object -ExpandProperty Name
$thermalPrinter = $printers | Where-Object { $_ -match "58|POS|Thermal|XP-58|MPT|Generic / Text" } | Select-Object -First 1

if (-not $thermalPrinter) {
    $defaultObj = Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1
    $thermalPrinter = $defaultObj.Name
}

if (-not $thermalPrinter) {
    Write-Host "No se detecto ninguna impresora instalada en Windows." -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  ECAR ERP - Puente de Impresion ESC/POS 58mm (RAW)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Impresora seleccionada: $thermalPrinter" -ForegroundColor Green
Write-Host "Escuchando en: http://127.0.0.1:18181/print" -ForegroundColor Yellow
Write-Host "Deje esta ventana abierta para imprimir desde ECAR." -ForegroundColor Gray
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:18181/")
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS + Private Network Access (necesario para Chrome desde HTTPS Vercel -> 127.0.0.1)
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        $response.Headers.Add("Access-Control-Allow-Private-Network", "true")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/print") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $json = $body | ConvertFrom-Json
                $bytes = [System.Convert]::FromBase64String($json.escposBase64)

                $sent = [RawPrinterHelper]::SendBytesToPrinter($thermalPrinter, $bytes)
                if ($sent) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Ticket ESC/POS enviado ($($bytes.Length) bytes) -> $thermalPrinter" -ForegroundColor Green
                    $out = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
                    $response.StatusCode = 200
                } else {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Error enviando a impresora $thermalPrinter" -ForegroundColor Red
                    $out = [System.Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"WritePrinter failed"}')
                    $response.StatusCode = 500
                }
                $response.ContentType = "application/json"
                $response.OutputStream.Write($out, 0, $out.Length)
            } catch {
                $errMsg = $_.Exception.Message -replace '"', '\"'
                $out = [System.Text.Encoding]::UTF8.GetBytes("{`"ok`":false,`"error`":`"$errMsg`"}")
                $response.StatusCode = 500
                $response.ContentType = "application/json"
                $response.OutputStream.Write($out, 0, $out.Length)
            } finally {
                $response.Close()
            }
        } else {
            $out = [System.Text.Encoding]::UTF8.GetBytes('{"service":"ecar-escpos-bridge","status":"running"}')
            $response.StatusCode = 200
            $response.ContentType = "application/json"
            $response.OutputStream.Write($out, 0, $out.Length)
            $response.Close()
        }
    }
} finally {
    $listener.Stop()
}
