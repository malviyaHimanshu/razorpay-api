const express = require('express')
const axios = require('axios');
var bodyParser = require('body-parser')
require("dotenv").config();

const app = express()
const port = 3000
var jsonParser = bodyParser.json()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

async function createFundAccount(upiID, contactID, headers) {
    const fund_data = {
        "contact_id": contactID,
        "account_type": "vpa",
        "vpa": {
            "address": upiID
        }
    }
    const fund_response = await axios.post('https://api.razorpay.com/v1/fund_accounts', fund_data, { headers });
    return fund_response.data.id
}

async function createPayout(amount, fundID, headers) {
    const payout_data = {
        "account_number": "2323230096725838",
        "fund_account_id": fundID,
        "amount": amount,
        "currency": "INR",
        "mode": "UPI",
        "purpose": "payout",
        "queue_if_low_balance": true,
        "reference_id": "FlowPay Transaction ID 12345",
        "narration": "FlowPay Fund Transfer"
    }
    const payout_response = await axios.post('https://api.razorpay.com/v1/payouts', payout_data, { headers });
    return payout_response.data.id
}

app.post('/send_amount', jsonParser, async (req, res) => {
    try {
        const name = req.body.name
        const amount = req.body.amount
        const upiID = req.body.upiID

        const contact_data = {
            "name": name,
            "type": "customer",
            "reference_id": "Acme Contact ID 12345",
            "notes":{
              "random_key_1": "Make it so.",
              "random_key_2": "Tea. Earl Grey. Hot."
            }
        };
        const headers = {
            'Authorization': `Basic ${Buffer.from(`${process.env.KEY_ID}:${process.env.KEY_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json',
        };

        const contact_response = await axios.post('https://api.razorpay.com/v1/contacts', contact_data, { headers });
        const contactID = await contact_response.data.id
        
        const fundID = await createFundAccount(upiID, contactID, headers)

        const payoutID = await createPayout(amount, fundID, headers);
        console.log(payoutID);
        
        res.status(200).json({
            message: 'Transaction completed successfully!',
            payout_id: payoutID
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Error Occured',
            error: err.message,
        });
    }
});