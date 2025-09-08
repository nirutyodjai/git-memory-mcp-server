const saml = require('saml2-js');

class EnterpriseSSO {
    constructor(config) {
        this.config = config;
        this.sp = new saml.ServiceProvider(config.sp_options);
        this.idp = new saml.IdentityProvider(config.idp_options);
    }

    getLoginUrl(redirectUrl, callback) {
        this.sp.create_login_request_url(this.idp, { relay_state: redirectUrl }, callback);
    }

    assert(request, callback) {
        this.sp.post_assert(this.idp, { request_body: request.body }, callback);
    }

    getMetadata() {
        return this.sp.create_metadata();
    }
}

module.exports = EnterpriseSSO;