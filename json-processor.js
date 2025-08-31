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
    jsonObject.sourceInfoLocalized.en_US.parentprojectfile = `C:\\Users\\studio.mangoo\\AppData\\Local\\Temp\\aegraphic\\${generateUUID()}\\aemogrtFiles\\`;

    // Gruplama için ID'ler ve anahtar kelimeler
    const globalGroupUiName = "Global Controllers";
    const sceneGroupUiName = "Scene Controllers";
    const mediaGroupUiName = "Media";
    const globalGroupId = generateUUID();
    const sceneGroupId = generateUUID();
    const mediaGroupId = generateUUID();

    // Client Controls ve Capsule Params dizileri için hazırlık
    let newClientControls = [];
    let newCapsuleParams = [];

    // Gruplama için alt eleman ID'lerini toplayan nesneler
    const globalControlIds = [];
    const mediaControlIds = [];
    
    // Eski clientControls dizisini işleyerek yeni yapıyı oluşturma
    jsonObject.clientControls.forEach(control => {
        if (control.uiName.strDB[0].str.includes("Global Controllers")) {
            globalControlIds.push(control.id);
            control.uiName.strDB[0].str = control.uiName.strDB[0].str.replace("Global Controllers | ", "");
            newClientControls.push(control);
        } else if (control.uiName.strDB[0].str.includes("Scene Controllers | Media")) {
            mediaControlIds.push(control.id);
            control.uiName.strDB[0].str = control.uiName.strDB[0].str.replace("Scene Controllers | Media | ", "");
            newClientControls.push(control);

            if (control.thumbnail) {
                control.thumbnail = `${generateUUID()}.png`;
            }
        } else {
             newClientControls.push(control);
        }
    });

    // Gruplama elemanlarını yeni clientControls dizisine ekleme
    const globalGroup = {
        "canAnimate": true,
        "groupexpanded": false,
        "id": globalGroupId,
        "type": 10,
        "uiName": { "strDB": [{"localeString": "en_US", "str": globalGroupUiName}] },
        "uiSuffix": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "uiToolTip": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "value": globalControlIds
    };
    const mediaGroup = {
        "canAnimate": true,
        "groupexpanded": false,
        "id": mediaGroupId,
        "type": 10,
        "uiName": { "strDB": [{"localeString": "en_US", "str": mediaGroupUiName}] },
        "uiSuffix": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "uiToolTip": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "value": mediaControlIds
    };
    const sceneGroup = {
        "canAnimate": true,
        "groupexpanded": false,
        "id": sceneGroupId,
        "type": 10,
        "uiName": { "strDB": [{"localeString": "en_US", "str": sceneGroupUiName}] },
        "uiSuffix": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "uiToolTip": { "strDB": [{"localeString": "en_US", "str": ""}] },
        "value": [mediaGroupId]
    };
    
    newClientControls.unshift(globalGroup);
    newClientControls.splice(newClientControls.findIndex(c => c.id === mediaControlIds[0]), 0, mediaGroup);
    newClientControls.splice(newClientControls.findIndex(c => c.id === mediaGroupId), 0, sceneGroup);

    // Eski capsuleparams dizisini işleyerek yeni yapıyı oluşturma
    jsonObject.sourceInfoLocalized.en_US.capsuleparams.capParams.forEach(param => {
        if (param.capPropUIName.includes("Global Controllers")) {
            param.capPropUIName = param.capPropUIName.replace("Global Controllers | ", "");
            newCapsuleParams.push(param);
        } else if (param.capPropUIName.includes("Scene Controllers | Media")) {
            param.capPropUIName = param.capPropUIName.replace("Scene Controllers | Media | ", "");
            newCapsuleParams.push(param);
            if (param.thumbnail) {
                param.thumbnail = `${generateUUID()}.png`;
            }
        } else {
            newCapsuleParams.push(param);
        }
    });

    // Gruplama elemanlarını yeni capsuleparams dizisine ekleme
    const newGlobalGroupParam = {
        "capPropAnimatable": false,
        "capPropDefault": globalControlIds,
        "capPropGroupExpanded": false,
        "capPropMatchName": globalGroupId,
        "capPropType": 8,
        "capPropUIName": globalGroupUiName
    };
    const newMediaGroupParam = {
        "capPropAnimatable": false,
        "capPropDefault": mediaControlIds,
        "capPropGroupExpanded": false,
        "capPropMatchName": mediaGroupId,
        "capPropType": 8,
        "capPropUIName": mediaGroupUiName
    };
    const newSceneGroupParam = {
        "capPropAnimatable": false,
        "capPropDefault": [mediaGroupId],
        "capPropGroupExpanded": false,
        "capPropMatchName": sceneGroupId,
        "capPropType": 8,
        "capPropUIName": sceneGroupUiName
    };

    newCapsuleParams.unshift(newGlobalGroupParam);
    newCapsuleParams.splice(newCapsuleParams.findIndex(p => p.capPropMatchName === mediaControlIds[0]), 0, newMediaGroupParam);
    newCapsuleParams.splice(newCapsuleParams.findIndex(p => p.capPropMatchName === mediaGroupId), 0, newSceneGroupParam);

    // Güncellenmiş dizileri orijinal nesneye geri atama
    jsonObject.clientControls = newClientControls;
    jsonObject.sourceInfoLocalized.en_US.capsuleparams.capParams = newCapsuleParams;

    return jsonObject;
}

// Fonksiyonları global kapsamda erişilebilir yap
window.processJson = processJson;
window.generateUUID = generateUUID;