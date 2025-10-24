# Mobile Control Testing Guide

## Quick Start Testing

### 1. Start the Development Server

```bash
cd /Users/Perovrohliku/Developero/kurve
npm run dev
```

The game should be available at `http://localhost:5174/` (or another port if 5174 is busy).

### 2. Desktop-Only Testing (Quick Test)

1. Open the game in your browser
2. Look for the "📱 Mobile Control" section at the bottom of the menu
3. Right-click the QR code and select "Copy link address" or "Copy image"
4. You should see a URL like: `http://localhost:5174/mobile-controller.html?peer=xxxxx`
5. Open that URL in a new browser tab/window
6. You should see the mobile controller interface with LEFT and RIGHT buttons
7. Click the buttons - they should respond with visual feedback
8. The main game window should show "1 controller connected"

### 3. Mobile Device Testing (Full Test)

#### Option A: Using QR Code (Recommended)

1. Open the game on your desktop: `http://localhost:5174/`
2. On your phone, open the camera app
3. Point it at the QR code shown in the menu
4. Tap the notification/link that appears
5. The mobile controller page should open
6. You should see "Connected!" and your player assignment

#### Option B: Manual URL Entry

1. Find your computer's local IP address:
   - Mac: System Preferences → Network
   - Windows: `ipconfig` in command prompt
   - Example: `192.168.1.100`

2. Update Vite to expose the server (stop the current server and run):
   ```bash
   npm run dev -- --host
   ```

3. On your phone's browser, navigate to:
   ```
   http://192.168.1.100:5174/mobile-controller.html?peer=PEER_ID
   ```
   (Replace `192.168.1.100` with your IP and `PEER_ID` with the actual peer ID shown in the QR code URL)

### 4. Testing Gameplay

1. **Single Controller Test**:
   - Connect one mobile controller
   - Select players in the menu (make sure the first player - Red - is active)
   - Press SPACE to start the game
   - Touch LEFT and RIGHT on your phone
   - The red curve should turn accordingly

2. **Multiple Controller Test**:
   - Connect 2-3 phones
   - Each should get assigned different players (Red, Orange, Green, etc.)
   - Activate those players in the menu
   - Press SPACE to start
   - Each phone controls its respective curve

3. **Mixed Input Test**:
   - Connect 1 mobile controller (for Red player)
   - Activate Red and Orange players
   - Press SPACE to start
   - Control Red with phone, Orange with keyboard (← →)
   - Both should work simultaneously

## What to Test

### ✅ Connection Tests

- [ ] QR code appears in menu
- [ ] QR code contains valid URL
- [ ] Mobile page loads successfully
- [ ] Connection status shows "Connected!"
- [ ] Player assignment displays correctly
- [ ] Connection counter increments
- [ ] Multiple devices can connect
- [ ] Desktop shows correct connection count

### ✅ Input Tests

- [ ] LEFT button changes color when pressed
- [ ] RIGHT button changes color when pressed
- [ ] Desktop receives input events
- [ ] Curve turns left when LEFT is touched
- [ ] Curve turns right when RIGHT is touched
- [ ] Input works during active gameplay
- [ ] No input lag (< 200ms)
- [ ] Haptic feedback works (phone vibrates)

### ✅ Gameplay Tests

- [ ] Game starts normally with controllers connected
- [ ] Controller input works throughout round
- [ ] Controllers work in death match mode
- [ ] Reverse controls power-up affects controller input
- [ ] Game can be played with only controllers (no keyboard)
- [ ] Game can be played with mixed keyboard + controllers
- [ ] Controllers work across multiple rounds

### ✅ Disconnect Tests

- [ ] Closing mobile page disconnects gracefully
- [ ] Connection counter decrements
- [ ] Player can continue with keyboard after disconnect
- [ ] Reconnecting works (scan QR again)

### ✅ Error Handling

- [ ] Invalid peer ID shows error on mobile
- [ ] Network issues display appropriate message
- [ ] Page refresh on mobile reconnects properly
- [ ] Desktop game continues if controller disconnects mid-game

### ✅ UI/UX Tests

- [ ] QR code is clearly visible
- [ ] Mobile buttons are large and easy to press
- [ ] Player colors match between desktop and mobile
- [ ] Connection status is clearly displayed
- [ ] Mobile page is responsive (portrait/landscape)
- [ ] Touch areas don't overlap or miss touches

### ✅ Browser Compatibility

Desktop:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Mobile:
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet

## Common Issues & Solutions

### Issue: QR Code Not Showing
**Solution**: 
- Check browser console for errors
- Ensure PeerJS loaded: look for `<script src="https://unpkg.com/peerjs...">` in page source
- Wait 2-3 seconds for peer ID generation

### Issue: Mobile Page Shows "Connecting..." Forever
**Solution**:
- Check the peer ID in URL matches the one in desktop console
- Verify both devices are on the internet
- Try refreshing the mobile page
- Check for firewall/VPN blocking WebRTC

### Issue: Controller Works But Curve Doesn't Turn
**Solution**:
- Make sure the player is activated (clicked in menu)
- Check console for errors
- Verify player ID matches controller ID (Red = 0, Orange = 1, etc.)

### Issue: "localhost" URL Doesn't Work on Mobile
**Solution**:
- `localhost` only works on the same device
- Use `--host` flag with vite and your computer's IP address
- Or test with desktop browser tabs

### Issue: Connection Drops Frequently
**Solution**:
- Keep mobile browser in foreground
- Disable battery saver
- Improve WiFi signal
- Try different browser on mobile

## Debug Mode

To see detailed logs:

1. **Desktop Console** (F12):
   ```javascript
   // Should see:
   "Host peer ID: xxxxx"
   "Controller connected: 0"
   ```

2. **Mobile Console** (Remote debugging):
   - Chrome Android: chrome://inspect
   - Safari iOS: Safari → Develop → [Your Phone]
   
   ```javascript
   // Should see:
   "Connecting to game..."
   "Connected to game!"
   "Assigned controller ID: 0"
   ```

## Performance Testing

Monitor for:
- Frame rate stays at 60 FPS
- Input latency < 200ms (touch to curve turn)
- No memory leaks after multiple rounds
- No console errors during gameplay

## Success Criteria

The mobile control feature is working correctly if:

1. ✅ QR code appears and is scannable
2. ✅ Mobile devices connect successfully
3. ✅ Input controls the curve in real-time
4. ✅ Multiple controllers work simultaneously
5. ✅ Mixed keyboard + controller gameplay works
6. ✅ No crashes or errors during normal use
7. ✅ Performance remains smooth (60 FPS)

## Next Steps After Testing

If all tests pass:
1. Commit the changes
2. Test on production build (`npm run build`)
3. Consider adding to main branch
4. Update main README with mobile control info

If issues found:
1. Document the issue
2. Check browser console for errors
3. Review MOBILE_CONTROL.md for troubleshooting
4. File bug report with reproduction steps
