const express = require('express');
const router = express.Router();
const EnterpriseSSO = require('../services/EnterpriseSSO');

// Mock config
const config = {
    sp_options: {
        entity_id: 'https://your-app.com/metadata.xml',
        assert_endpoint: 'https://your-app.com/sso/assert',
    },
    idp_options: {
        sso_login_url: 'https://idp.com/sso/login',
        sso_logout_url: 'https://idp.com/sso/logout',
        certificates: ['...idp-certificate...'],
    },
};

const enterpriseSSO = new EnterpriseSSO(config);

router.get('/login', (req, res) => {
    enterpriseSSO.getLoginUrl(req.query.redirectUrl, (err, loginUrl) => {
        if (err) {
            return res.status(500).send('Error generating login URL');
        }
        res.redirect(loginUrl);
    });
});

router.post('/assert', (req, res) => {
    enterpriseSSO.assert(req, (err, result) => {
        if (err) {
            return res.status(500).send('Error asserting SSO');
        }
        // Handle successful login, e.g., create a session
        res.json(result);
    });
});

router.get('/metadata', (req, res) => {
    res.type('application/xml');
    res.send(enterpriseSSO.getMetadata());
});

module.exports = router;