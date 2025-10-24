var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const emojiMap = {
    smile: "😊",
    wink: "😉",
    heart: "😍",
    cry: "😭",
};
// default to smile
let selectedEmoji = emojiMap.smile;
addButtonListeners();
// existing emoji insertion behavior
document.getElementById("extension-form").onsubmit = (event) => __awaiter(this, void 0, void 0, function* () {
    event.preventDefault();
    try {
        // Get the current selected Element
        const el = yield window.webflow.getSelectedElement();
        // If styles can be set on the Element
        if (el && el.styles && el.children) {
            //Get current element's style
            const currentStyle = yield el.getStyles();
            // Get style
            const emojiStyle = yield createOrUseStyle("emoji-style");
            // Create a new element that will display the text-emoji
            const labelElement = yield el.append(window.webflow.elementPresets.DOM);
            yield labelElement.setTag("span");
            yield labelElement.setStyles([...currentStyle, emojiStyle]);
            yield labelElement.setTextContent(selectedEmoji);
        }
        else {
            alert("Please select a text element");
        }
    }
    catch (err) {
        alert("Extension error: " + err);
    }
});
// Check if specified style exists. If not, create a new style
function createOrUseStyle(styleName) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if this style exists to avoid duplicate styles
        const style = yield window.webflow.getStyleByName(styleName);
        if (style) {
            // Return existing style
            return style;
        }
        else {
            // Create a new style, return it
            const emojiStyle = yield window.webflow.createStyle(styleName);
            yield emojiStyle.setProperties({ "background-color": "#FF00FF" });
            return emojiStyle;
        }
    });
}
function handleEmojiClick(emoji) {
    selectedEmoji = emoji;
}
function addButtonListeners() {
    document.getElementById("smile").onclick = () => {
        handleEmojiClick(emojiMap.smile);
    };
    document.getElementById("wink").onclick = () => {
        handleEmojiClick(emojiMap.wink);
    };
    document.getElementById("heart").onclick = () => {
        handleEmojiClick(emojiMap.heart);
    };
    document.getElementById("cry").onclick = () => {
        handleEmojiClick(emojiMap.cry);
    };
    // design scanner
    const getDesignBtn = document.getElementById("getDesign");
    if (getDesignBtn) {
        getDesignBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
            const resultEl = document.getElementById("designResult");
            try {
                resultEl.textContent = "Getting current design...";
                // Get site information
                const site = yield window.webflow.getSite();
                const siteId = site._id;
                // Get all styles
                const allStyles = yield window.webflow.getStyles();
                // Get selected element details
                const selectedEl = yield window.webflow.getSelectedElement();
                let selectedElementInfo = null;
                if (selectedEl) {
                    const elementStyles = yield selectedEl.getStyles();
                    const elementTag = yield selectedEl.getTag();
                    const elementId = yield selectedEl.getId();
                    selectedElementInfo = {
                        tag: elementTag,
                        id: elementId,
                        styles: elementStyles
                    };
                }
                const designData = {
                    siteId: siteId,
                    siteName: site.name,
                    allStyles: allStyles,
                    selectedElement: selectedElementInfo,
                    timestamp: new Date().toISOString()
                };
                resultEl.textContent = "Design data retrieved successfully!";
                console.log("Current Design Data:", designData);
                // You can also send this to your API
                const apiBaseInput = document.getElementById("apiBase").value.trim();
                const origin = apiBaseInput || window.location.origin;
                const target = origin.replace(/\/$/, "") + "/api/webflow/design";
                try {
                    const res = yield fetch(target, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(designData),
                    });
                    if (res.ok) {
                        resultEl.textContent += " - Design data sent to API successfully!";
                    }
                    else {
                        resultEl.textContent += " - Design data retrieved but API send failed.";
                    }
                }
                catch (apiErr) {
                    resultEl.textContent += " - Design data retrieved but API send failed.";
                }
            }
            catch (err) {
                resultEl.textContent = "Design scan error: " + String(err);
            }
        });
    }
    // form scanner
    const scanBtn = document.getElementById("scanForm");
    if (scanBtn) {
        scanBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
            const resultEl = document.getElementById("scanResult");
            try {
                resultEl.textContent = "Scanning selected element...";
                const el = yield window.webflow.getSelectedElement();
                if (!el) {
                    resultEl.textContent = "No element selected. Please select a form in the designer.";
                    return;
                }
                // Attempt to read form attributes and children inputs
                const formId = (el.getAttribute && (yield el.getAttribute("id"))) || el.id || el.getId && (yield el.getId()) || null;
                const formName = (el.getAttribute && (yield el.getAttribute("name"))) || el.name || null;
                // recursively traverse children to find inputs, selects, textareas
                function collectInputs(node) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const arr = [];
                        try {
                            const children = node.children || (node.getChildren && (yield node.getChildren()));
                            if (children && children.length) {
                                for (const c of children) {
                                    try {
                                        const tag = (c.getTag && (yield c.getTag())) || (c.tagName && c.tagName.toLowerCase()) || "";
                                        if (tag === "input" || tag === "select" || tag === "textarea") {
                                            const id = (c.getAttribute && (yield c.getAttribute("id"))) || c.id || (c.getId && (yield c.getId())) || null;
                                            const name = (c.getAttribute && (yield c.getAttribute("name"))) || c.name || null;
                                            const type = (c.getAttribute && (yield c.getAttribute("type"))) || c.type || tag;
                                            arr.push({ id, name, type });
                                        }
                                        // recurse
                                        const childInputs = yield collectInputs(c);
                                        if (childInputs.length)
                                            arr.push(...childInputs);
                                    }
                                    catch (err) {
                                        // ignore child errors
                                    }
                                }
                            }
                        }
                        catch (err) {
                            // ignore
                        }
                        return arr;
                    });
                }
                const fields = yield collectInputs(el);
                const payload = {
                    siteId: window.webflow && window.webflow.siteId ? window.webflow.siteId : window.webflow.getSite && ((yield window.webflow.getSite) && (yield window.webflow.getSite())._id) || null,
                    forms: [{ id: formId || undefined, name: formName || undefined, fields }],
                };
                if (!payload.siteId) {
                    resultEl.textContent = "Could not determine site id from the designer. You can still copy the form JSON below and post it to your app manually.";
                    const pretty = JSON.stringify(payload, null, 2);
                    resultEl.textContent = "Scanned payload:\n" + pretty;
                    return;
                }
                // determine target API base
                const apiBaseInput = document.getElementById("apiBase").value.trim();
                const origin = apiBaseInput || window.location.origin;
                const target = origin.replace(/\/$/, "") + "/api/forms/collect";
                resultEl.textContent = `Sending to ${target}...`;
                const res = yield fetch(target, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const txt = yield res.text();
                    resultEl.textContent = `Server error (${res.status}): ${txt}`;
                    return;
                }
                resultEl.textContent = "Form payload sent successfully.";
            }
            catch (err) {
                (document.getElementById("scanResult")).textContent = "Scan error: " + String(err);
            }
        });
    }
}
