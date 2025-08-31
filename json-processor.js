// Benzersiz bir UUID oluşturur
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// JSON nesnesini güncelleme işlemini yapar
function processJson(jsonObject) {
    // Kök seviye güncellemeler
    jsonObject.capsuleID = generateUUID();
    jsonObject.sourceInfoLocalized.en_US.parentprojectfile = `C:\\aemogrt_temp_path\\${generateUUID()}\\aemogrtFiles\\`;

    const clientControlsMap = new Map();
    const capParamsMap = new Map();

    // Client Controls ve Capsule Params için dinamik ağaç yapısı oluşturur
    function buildGroupTree(controls, isCapParam = false) {
        const root = {};
        const paramMap = new Map();

        controls.forEach(control => {
            const uiName = isCapParam ? control.capPropUIName : (control.uiName?.strDB?.[0]?.str || '');
            const parts = uiName.split('|').map(p => p.trim()).filter(p => p.length > 0);
            
            if (parts.length === 0) {
                // Grupsuz kontrolleri doğrudan ekle
                const id = isCapParam ? control.capPropMatchName : control.id;
                root[id] = control;
                return;
            }

            let currentLevel = root;
            let currentPath = '';

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                currentPath += part + '|';
                const groupName = part;

                if (!currentLevel[groupName]) {
                    const groupId = paramMap.has(currentPath) ? paramMap.get(currentPath) : generateUUID();
                    paramMap.set(currentPath, groupId);

                    const groupObj = {
                        "canAnimate": true,
                        "groupexpanded": false,
                        "id": groupId,
                        "type": 10,
                        "uiName": { "strDB": [{"localeString": "en_US", "str": groupName}] },
                        "uiSuffix": { "strDB": [{"localeString": "en_US", "str": ""}] },
                        "uiToolTip": { "strDB": [{"localeString": "en_US", "str": ""}] },
                        "value": []
                    };
                    const paramObj = {
                        "capPropAnimatable": false,
                        "capPropDefault": [],
                        "capPropGroupExpanded": false,
                        "capPropMatchName": groupId,
                        "capPropType": 8,
                        "capPropUIName": groupName
                    };

                    currentLevel[groupName] = {
                        groupObj,
                        paramObj,
                        children: {}
                    };
                }
                currentLevel = currentLevel[groupName].children;
            }
            
            const lastPart = parts[parts.length - 1];
            const finalControlId = isCapParam ? control.capPropMatchName : control.id;
            
            if (isCapParam) {
                if (control.thumbnail) {
                    control.thumbnail = `${generateUUID()}.png`;
                }
                currentLevel[finalControlId] = control;
            } else {
                if (control.thumbnail) {
                    control.thumbnail = `${generateUUID()}.png`;
                }
                control.uiName.strDB[0].str = lastPart;
                currentLevel[finalControlId] = control;
            }
        });
        return { root, paramMap };
    }

    // Ağaç yapısını düz bir diziye dönüştürür ve UUID'leri günceller
    function flattenTree(tree, flatArray = [], paramValue = []) {
        for (const key in tree) {
            const node = tree[key];
            if (node.groupObj) {
                // Bu bir grup
                flatArray.push(node.groupObj);
                paramValue.push(node.groupObj.id);
                // Alt elemanları ekle
                flattenTree(node.children, flatArray, node.groupObj.value);
            } else {
                // Bu bir kontrol
                flatArray.push(node);
                paramValue.push(node.id);
            }
        }
        return flatArray;
    }

    // Aynı işlemi capsuleparams için de yap
    function flattenParamTree(tree, flatArray = [], paramValue = []) {
        for (const key in tree) {
            const node = tree[key];
            if (node.paramObj) {
                // Bu bir grup
                flatArray.push(node.paramObj);
                paramValue.push(node.paramObj.capPropMatchName);
                // Alt elemanları ekle
                flattenParamTree(node.children, flatArray, node.paramObj.capPropDefault);
            } else {
                // Bu bir kontrol
                flatArray.push(node);
                paramValue.push(node.capPropMatchName);
            }
        }
        return flatArray;
    }

    // Ana işlem
    const clientTree = buildGroupTree(jsonObject.clientControls);
    const paramTree = buildGroupTree(jsonObject.sourceInfoLocalized.en_US.capsuleparams.capParams, true);

    const newClientControls = flattenTree(clientTree.root);
    const newCapsuleParams = flattenParamTree(paramTree.root);

    // Güncellenmiş dizileri orijinal nesneye geri atama
    jsonObject.clientControls = newClientControls;
    jsonObject.sourceInfoLocalized.en_US.capsuleparams.capParams = newCapsuleParams;

    return jsonObject;
}

// Fonksiyonları global kapsamda erişilebilir yap
window.processJson = processJson;
window.generateUUID = generateUUID;