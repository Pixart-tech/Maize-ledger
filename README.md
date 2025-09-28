<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hnDv3qcjg6bO_6KTKgEdOl0x6UEOtOeV

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Refreshing the seeded demo data

Existing preview environments may already have the legacy `seeded` flag in `localStorage`. To upgrade to the richer voucher sample:

1. Start the app locally (`npm run dev`) and open it in the browser.
2. Open the browser developer tools console and run the following snippet to clear the previous seed and reload the page:

   ```js
   localStorage.removeItem('seeded_v2');
   ['parties', 'crops', 'chargeHeads', 'bankAccounts', 'transactions'].forEach(key => localStorage.removeItem(key));
   location.reload();
   ```

3. After the page refreshes, the Dashboard **Recent Transactions** table and the **Party Ledger** report will display the new sample vouchers covering Purchase, Sale, Asami, Zero Dalal, Payment (Paid & Received), and Cash scenarios.
