"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterSubscription = NewsletterSubscription;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const lucide_react_1 = require("lucide-react");
function NewsletterSubscription({ className = '', variant = 'default', showDescription = true, onSubscribe, }) {
    const { t } = (0, react_i18next_1.useTranslation)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [firstName, setFirstName] = (0, react_1.useState)('');
    const [lastName, setLastName] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [errorMessage, setErrorMessage] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setStatus('error');
            setErrorMessage(t('email.validation.required'));
            return;
        }
        if (!isValidEmail(email)) {
            setStatus('error');
            setErrorMessage(t('email.validation.invalid'));
            return;
        }
        setIsLoading(true);
        setStatus('idle');
        setErrorMessage('');
        try {
            if (onSubscribe) {
                await onSubscribe(email, firstName || undefined, lastName || undefined);
            }
            else {
                // Default API call
                const response = await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        firstName: firstName || undefined,
                        lastName: lastName || undefined,
                    }),
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || t('email.subscription.error'));
                }
            }
            setStatus('success');
            setEmail('');
            setFirstName('');
            setLastName('');
        }
        catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : t('email.subscription.error'));
        }
        finally {
            setIsLoading(false);
        }
    };
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    if (variant === 'minimal') {
        return (<form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <div className="flex-1">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email.placeholder')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading}/>
        </div>
        <button type="submit" disabled={isLoading || !email} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isLoading ? (<lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>) : (<lucide_react_1.Mail className="w-4 h-4"/>)}
          {t('email.subscribe')}
        </button>
      </form>);
    }
    if (variant === 'card') {
        return (<div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide_react_1.Mail className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('email.newsletter.title')}
          </h3>
          {showDescription && (<p className="text-gray-600 dark:text-gray-400">
              {t('email.newsletter.description')}
            </p>)}
        </div>

        {status === 'success' ? (<div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide_react_1.Check className="w-6 h-6 text-green-600 dark:text-green-400"/>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('email.subscription.success.title')}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {t('email.subscription.success.message')}
            </p>
          </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('email.firstName')} ({t('common.optional')})
                </label>
                <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('email.firstName')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading}/>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('email.lastName')} ({t('common.optional')})
                </label>
                <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('email.lastName')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading}/>
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email.address')} *
              </label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email.placeholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading} required/>
            </div>

            {status === 'error' && (<div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <lucide_react_1.AlertCircle className="w-4 h-4"/>
                {errorMessage}
              </div>)}

            <button type="submit" disabled={isLoading || !email} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? (<>
                  <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                  {t('email.subscribing')}
                </>) : (<>
                  <lucide_react_1.Mail className="w-4 h-4"/>
                  {t('email.subscribe')}
                </>)}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('email.privacy.notice')}
            </p>
          </form>)}
      </div>);
    }
    // Default variant
    return (<div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('email.newsletter.title')}
        </h3>
        {showDescription && (<p className="text-gray-600 dark:text-gray-400">
            {t('email.newsletter.description')}
          </p>)}
      </div>

      {status === 'success' ? (<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide_react_1.Check className="w-6 h-6 text-green-600 dark:text-green-400"/>
          </div>
          <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            {t('email.subscription.success.title')}
          </h4>
          <p className="text-green-700 dark:text-green-300">
            {t('email.subscription.success.message')}
          </p>
        </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email.firstName')} ({t('common.optional')})
              </label>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('email.firstName')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading}/>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email.lastName')} ({t('common.optional')})
              </label>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('email.lastName')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading}/>
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('email.address')} *
            </label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email.placeholder')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoading} required/>
          </div>

          {status === 'error' && (<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <lucide_react_1.AlertCircle className="w-5 h-5"/>
              {errorMessage}
            </div>)}

          <button type="submit" disabled={isLoading || !email} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium">
            {isLoading ? (<>
                <lucide_react_1.Loader2 className="w-5 h-5 animate-spin"/>
                {t('email.subscribing')}
              </>) : (<>
                <lucide_react_1.Mail className="w-5 h-5"/>
                {t('email.subscribe')}
              </>)}
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('email.privacy.notice')}
          </p>
        </form>)}
    </div>);
}
//# sourceMappingURL=newsletter-subscription.js.map