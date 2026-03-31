# 🔍 Printer Debugging Guide - How to Check Print Orders

## Method 1: Check Electron Console Logs

### Step 1: Open Developer Tools
When running the desktop app, the DevTools should open automatically. If not:
- **Mac**: Press `Cmd + Option + I`
- **Windows/Linux**: Press `Ctrl + Shift + I`

### Step 2: Check Console Tab
Look for printer-related logs:

```
[PrinterTest] Testing connection to 192.168.0.1:9100...
[PrinterTest] ✓ Connection successful (234ms)
[PrinterTest] Sending test print to 192.168.0.1:9100...
[PrinterTest] ✓ Test print sent successfully
```

**Current Status Logs** (Simulation Mode):
```
=== PRINT RECEIPT (SIMULATED) ===
Printer: Test Printer
Connection: LAN
IP: 192.168.0.1
Port: 9100
Paper Width: 80mm
Receipt Data: {...}
===================================
```

---

## Method 2: Monitor Network Traffic to Printer

### Check if data is being sent to printer IP:

**On Mac/Linux:**
```bash
# Monitor all traffic to printer IP
sudo tcpdump -i any host 192.168.0.1

# Monitor only port 9100 (ESC/POS)
sudo tcpdump -i any host 192.168.0.1 and port 9100

# More detailed output
sudo tcpdump -i any -XX host 192.168.0.1 and port 9100
```

**What to look for:**
- `SYN` packets = Trying to connect
- `SYN-ACK` = Printer responded (connection works!)
- `PSH` packets = Data being sent to printer
- `RST` or `timeout` = Connection failed

**Example successful connection:**
```
14:23:45.123456 IP your-computer.12345 > 192.168.0.1.9100: Flags [S], seq 123456
14:23:45.125678 IP 192.168.0.1.9100 > your-computer.12345: Flags [S.], seq 789012
14:23:45.127890 IP your-computer.12345 > 192.168.0.1.9100: Flags [P.], data...
```

---

## Method 3: Check Printer's Built-in Queue/Log

### Most network printers have a web interface:

1. **Open browser and go to**: `http://192.168.0.1`
2. **Look for**:
   - "Print Queue" or "Job History"
   - "Logs" or "Event Log"
   - "Status" page

3. **Check for**:
   - Received jobs
   - Failed jobs
   - Connection attempts
   - Paper/hardware errors

---

## Method 4: Test Raw Socket Connection

### Send raw test data to printer:

```bash
# Simple text test (Mac/Linux)
echo "TEST PRINT FROM TERMINAL" | nc 192.168.0.1 9100

# ESC/POS test (should print and cut)
printf "\x1b@TEST PRINT\n\n\n\x1dVA\x00" | nc 192.168.0.1 9100
```

**What should happen:**
- ✅ Printer should print the text
- ✅ No error in terminal
- ❌ If timeout or "Connection refused" = printer not reachable

---

## Method 5: Check Application Logs in Real-time

### Enable detailed logging:

**Add to**: `electron/printer/printerManager.ts` (at the top of printReceipt function)

```typescript
console.log('===========================================');
console.log('PRINT REQUEST RECEIVED');
console.log('Time:', new Date().toISOString());
console.log('Config:', JSON.stringify(printerConfig, null, 2));
console.log('Receipt Data:', JSON.stringify(receiptData, null, 2));
console.log('===========================================');
```

Then watch logs when you create a sale.

---

## Method 6: Check IPC Communication

### Verify IPC messages are flowing:

**Add to**: `electron/printer/ipcHandlers.ts`

```typescript
ipcMain.handle('printer:printReceipt', async (_event, receiptData, config) => {
  console.log('📨 IPC: printReceipt called');
  console.log('📨 Receipt ID:', receiptData.id);
  console.log('📨 Config:', config ? 'Provided' : 'Using default');

  const result = await printerManager.printReceipt(receiptData, config);

  console.log('📤 IPC: printReceipt result:', result);
  return result;
});
```

---

## 🔧 Step-by-Step Debugging Process

### 1. **Verify Printer is Reachable**
```bash
ping 192.168.0.1
# Should get replies
```

### 2. **Verify Port is Open**
```bash
nc -zv 192.168.0.1 9100
# Should say "Connection succeeded"
```

### 3. **Test Raw Print**
```bash
echo "TEST" | nc 192.168.0.1 9100
# Printer should print "TEST"
```

### 4. **Run App and Check Console**
- Open app
- Go to Printer Settings
- Click "Test Print"
- Watch console for logs

### 5. **Create Test Sale**
- Create a new sale
- Add product
- Complete payment
- Watch console logs
- Check if printer prints

### 6. **Monitor Network** (in another terminal)
```bash
sudo tcpdump -i any host 192.168.0.1 and port 9100
```
- Leave this running
- Create a sale in app
- Watch for network packets

---

## 📊 Expected Flow (When Implemented)

```
User clicks "Complete Sale"
    ↓
Frontend: SalesCreate.tsx
    ↓
Check autoPrintOnPayment setting
    ↓
Call printReceipt()
    ↓
Frontend: printService.ts
    ↓
Call window.printerAPI.printReceipt()
    ↓
IPC: Renderer → Main Process
    ↓
Electron: ipcHandlers.ts
    LOG: "📨 IPC: printReceipt called"
    ↓
Electron: printerManager.ts
    LOG: "Connecting to network printer: 192.168.0.1:9100"
    ↓
Network: TCP connection to 192.168.0.1:9100
    TCPDUMP: See SYN packets
    ↓
Network: Send ESC/POS commands
    TCPDUMP: See data packets
    ↓
Printer: Receives data and prints
    Printer Web UI: Shows job in queue
    ↓
Result: { success: true }
    LOG: "✓ Receipt printed successfully"
    ↓
Frontend: Shows toast notification
```

---

## 🚨 Current Status Check

**To check if printing is currently working:**

1. **Start the app**: `npm run dev:desktop`

2. **Open Console** (DevTools)

3. **Run in Console**:
```javascript
// Test if printerAPI exists
console.log('Printer API available:', !!window.printerAPI);

// Test connection
window.printerAPI.testNetworkConnection('192.168.0.1', 9100)
  .then(result => console.log('Connection test:', result));

// Test print
window.printerAPI.sendNetworkTestPrint('192.168.0.1', 9100, '80mm')
  .then(result => console.log('Test print:', result));
```

4. **Check the output** - it will tell you:
   - ✅ Connection successful → Printer reachable
   - ❌ Connection failed → Network/printer issue
   - ✅ Print successful → Data sent to printer
   - ❌ Print failed → ESC/POS issue

---

## 🔍 Common Issues & Solutions

### Issue 1: "Connection timeout"
**Cause**: Printer not reachable
**Check**:
```bash
ping 192.168.0.1
```
**Solution**:
- Verify IP address
- Check printer is on same network
- Check firewall settings

### Issue 2: "Connection refused"
**Cause**: Port 9100 not open
**Check**:
```bash
nc -zv 192.168.0.1 9100
```
**Solution**:
- Check printer port settings
- Try port 515 (LPD) or 631 (IPP)
- Enable RAW printing on printer

### Issue 3: "Prints gibberish"
**Cause**: Wrong character encoding
**Solution**:
- Change Character Set to `Windows-1256` (for Arabic)
- Check printer supports ESC/POS

### Issue 4: "Nothing prints"
**Cause**: ESC/POS code not implemented (CURRENT STATUS)
**Solution**:
- Implement Phase 2 of the plan
- Uncomment printing code in printerManager.ts

---

## 📝 Quick Test Checklist

Before creating a sale, verify:

- [ ] Printer is powered on
- [ ] Printer has paper loaded
- [ ] Printer is connected to network
- [ ] `ping 192.168.0.1` works
- [ ] `nc -zv 192.168.0.1 9100` succeeds
- [ ] `echo "TEST" | nc 192.168.0.1 9100` prints
- [ ] App is running (`npm run dev:desktop`)
- [ ] DevTools console is open
- [ ] Printer settings saved in app
- [ ] Test print button clicked (check console logs)
- [ ] Auto-print is enabled (if desired)

**If all ✅ but still not printing:**
→ Need to implement Phase 2 (actual ESC/POS printing code)

---

## 🎯 Next Step

**Right now**, the system is in **simulation mode**. To actually print:

**I need to implement Phase 2** which will:
1. Replace console.log with real ESC/POS commands
2. Open TCP socket to 192.168.0.1:9100
3. Send formatted receipt data
4. Handle errors properly

**Estimated time**: 2-3 hours

**Want me to implement it now?** 🚀
