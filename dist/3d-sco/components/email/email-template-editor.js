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
exports.EmailTemplateEditor = EmailTemplateEditor;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const lucide_react_1 = require("lucide-react");
function EmailTemplateEditor({ template, onSave, onPreview, className = '', }) {
    const { t } = (0, react_i18next_1.useTranslation)();
    const [viewMode, setViewMode] = (0, react_1.useState)('design');
    const [devicePreview, setDevicePreview] = (0, react_1.useState)('desktop');
    const [templateData, setTemplateData] = (0, react_1.useState)({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        category: 'newsletter',
        variables: [],
        ...template,
    });
    const [htmlContent, setHtmlContent] = (0, react_1.useState)(template?.htmlContent || '');
    const [textContent, setTextContent] = (0, react_1.useState)(template?.textContent || '');
    const [selectedElement, setSelectedElement] = (0, react_1.useState)(null);
    const [history, setHistory] = (0, react_1.useState)([htmlContent]);
    const [historyIndex, setHistoryIndex] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        if (template) {
            setTemplateData(template);
            setHtmlContent(template.htmlContent);
            setTextContent(template.textContent || '');
        }
    }, [template]);
    const addToHistory = (content) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(content);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setHtmlContent(history[newIndex]);
        }
    };
    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setHtmlContent(history[newIndex]);
        }
    };
    const handleSave = () => {
        const updatedTemplate = {
            ...templateData,
            htmlContent,
            textContent,
            updatedAt: new Date(),
        };
        onSave?.(updatedTemplate);
    };
    const handlePreview = () => {
        onPreview?.(htmlContent);
    };
    const insertElement = (elementType) => {
        let elementHtml = '';
        switch (elementType) {
            case 'heading':
                elementHtml = '<h2 style="color: #333; font-family: Arial, sans-serif; margin: 20px 0;">Your Heading</h2>';
                break;
            case 'paragraph':
                elementHtml = '<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6; margin: 15px 0;">Your paragraph text here.</p>';
                break;
            case 'button':
                elementHtml = '<a href="#" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif; font-weight: bold; margin: 10px 0;">Click Here</a>';
                break;
            case 'image':
                elementHtml = '<img src="https://via.placeholder.com/600x300" alt="Image" style="max-width: 100%; height: auto; display: block; margin: 20px 0;" />';
                break;
            case 'divider':
                elementHtml = '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />';
                break;
            case 'spacer':
                elementHtml = '<div style="height: 30px;"></div>';
                break;
        }
        const newContent = htmlContent + elementHtml;
        setHtmlContent(newContent);
        addToHistory(newContent);
    };
    const formatText = (command, value) => {
        document.execCommand(command, false, value);
    };
    const getDeviceWidth = () => {
        switch (devicePreview) {
            case 'mobile':
                return '375px';
            case 'tablet':
                return '768px';
            case 'desktop':
            default:
                return '100%';
        }
    };
    const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: white;
            padding: 30px;
            border: 1px solid #dee2e6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
            color: #6c757d;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{companyName}}</h1>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>Welcome to our newsletter. We're excited to share the latest updates with you.</p>
        <a href="{{actionUrl}}" class="button">Get Started</a>
        <p>If you have any questions, feel free to contact us.</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 {{companyName}}. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Update Preferences</a></p>
    </div>
</body>
</html>
  `;
    return (<div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <input type="text" value={templateData.name} onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })} placeholder={t('email.template.name')} className="text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"/>
          <input type="text" value={templateData.subject} onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })} placeholder={t('email.template.subject')} className="block mt-1 text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-400"/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50">
            <lucide_react_1.Undo className="w-4 h-4"/>
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50">
            <lucide_react_1.Redo className="w-4 h-4"/>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button onClick={handlePreview} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800">
            <lucide_react_1.Eye className="w-4 h-4"/>
            {t('common.preview')}
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <lucide_react_1.Save className="w-4 h-4"/>
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* View Mode */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button onClick={() => setViewMode('design')} className={`px-3 py-1 text-sm ${viewMode === 'design'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <lucide_react_1.Type className="w-4 h-4"/>
          </button>
          <button onClick={() => setViewMode('code')} className={`px-3 py-1 text-sm ${viewMode === 'code'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <lucide_react_1.Code className="w-4 h-4"/>
          </button>
          <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-sm ${viewMode === 'preview'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
            <lucide_react_1.Eye className="w-4 h-4"/>
          </button>
        </div>

        {viewMode === 'preview' && (<>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            {/* Device Preview */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button onClick={() => setDevicePreview('desktop')} className={`px-3 py-1 text-sm ${devicePreview === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                <lucide_react_1.Monitor className="w-4 h-4"/>
              </button>
              <button onClick={() => setDevicePreview('tablet')} className={`px-3 py-1 text-sm ${devicePreview === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                <lucide_react_1.Tablet className="w-4 h-4"/>
              </button>
              <button onClick={() => setDevicePreview('mobile')} className={`px-3 py-1 text-sm ${devicePreview === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                <lucide_react_1.Smartphone className="w-4 h-4"/>
              </button>
            </div>
          </>)}

        {viewMode === 'design' && (<>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            {/* Formatting Tools */}
            <div className="flex items-center gap-1">
              <button onClick={() => formatText('bold')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.Bold className="w-4 h-4"/>
              </button>
              <button onClick={() => formatText('italic')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.Italic className="w-4 h-4"/>
              </button>
              <button onClick={() => formatText('underline')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.Underline className="w-4 h-4"/>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            {/* Alignment */}
            <div className="flex items-center gap-1">
              <button onClick={() => formatText('justifyLeft')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.AlignLeft className="w-4 h-4"/>
              </button>
              <button onClick={() => formatText('justifyCenter')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.AlignCenter className="w-4 h-4"/>
              </button>
              <button onClick={() => formatText('justifyRight')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <lucide_react_1.AlignRight className="w-4 h-4"/>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            {/* Elements */}
            <div className="flex items-center gap-1">
              <button onClick={() => insertElement('heading')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title={t('email.template.elements.heading')}>
                <lucide_react_1.Type className="w-4 h-4"/>
              </button>
              <button onClick={() => insertElement('image')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title={t('email.template.elements.image')}>
                <lucide_react_1.Image className="w-4 h-4"/>
              </button>
              <button onClick={() => insertElement('button')} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title={t('email.template.elements.button')}>
                <lucide_react_1.Link className="w-4 h-4"/>
              </button>
            </div>
          </>)}

        <div className="flex-1"></div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setHtmlContent(defaultTemplate)} className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
            <lucide_react_1.Upload className="w-4 h-4"/>
            {t('email.template.useDefault')}
          </button>
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
            <lucide_react_1.Copy className="w-4 h-4"/>
            {t('common.copy')}
          </button>
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
            <lucide_react_1.Download className="w-4 h-4"/>
            {t('common.export')}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'design' && (<div className="flex-1 p-4">
            <div contentEditable dangerouslySetInnerHTML={{ __html: htmlContent }} onBlur={(e) => {
                const newContent = e.currentTarget.innerHTML;
                if (newContent !== htmlContent) {
                    setHtmlContent(newContent);
                    addToHistory(newContent);
                }
            }} className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 overflow-y-auto" style={{ minHeight: '400px' }}/>
          </div>)}

        {viewMode === 'code' && (<div className="flex-1 p-4">
            <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} onBlur={() => addToHistory(htmlContent)} className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" style={{ minHeight: '400px' }}/>
          </div>)}

        {viewMode === 'preview' && (<div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
            <div className="flex justify-center">
              <div style={{ width: getDeviceWidth(), maxWidth: '100%' }} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe srcDoc={htmlContent} className="w-full border-none" style={{ height: '600px' }} title="Email Preview"/>
              </div>
            </div>
          </div>)}
      </div>

      {/* Text Version */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('email.template.textVersion')}
        </label>
        <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder={t('email.template.textVersionPlaceholder')} className="w-full h-24 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"/>
      </div>
    </div>);
}
//# sourceMappingURL=email-template-editor.js.map