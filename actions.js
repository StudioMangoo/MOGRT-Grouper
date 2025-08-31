const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileMessage = document.getElementById('fileMessage');
const processButton = document.getElementById('processButton');
const downloadLinksContainer = document.getElementById('downloadLinksContainer');
const loadingMessage = document.getElementById('loadingMessage');

let filesToProcess = [];

document.addEventListener('DOMContentLoaded', setupEventListeners);

function setupEventListeners() {
    document.body.addEventListener('dragover', preventDefaults, false);
    document.body.addEventListener('drop', preventDefaults, false);

    dropArea.addEventListener('dragenter', handleDragEnter, false);
    dropArea.addEventListener('dragover', handleDragOver, false);
    dropArea.addEventListener('dragleave', handleDragLeave, false);
    dropArea.addEventListener('drop', handleDrop, false);

    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles([...e.target.files]);
        }
    });

    processButton.addEventListener('click', () => {
        if (filesToProcess.length > 0) {
            processAndDownloadAll();
        } else {
            fileMessage.textContent = 'Lütfen önce MOGRT dosyaları seçin veya sürükleyin.';
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragEnter() {
    dropArea.classList.add('bg-gray-50');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragLeave() {
    dropArea.classList.remove('bg-gray-50');
}

function handleDrop(e) {
    e.preventDefault();
    dropArea.classList.remove('bg-gray-50');
    const dt = e.dataTransfer;
    const files = [...dt.files];
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    const mogrtFiles = files.filter(file => file.name.endsWith('.mogrt'));
    
    if (mogrtFiles.length === 0) {
        fileMessage.textContent = 'Hata: Sadece .mogrt uzantılı dosyaları kabul edebiliriz.';
        processButton.style.display = 'none';
        filesToProcess = [];
        return;
    }

    filesToProcess = mogrtFiles;
    fileMessage.textContent = `Seçilen dosya sayısı: ${filesToProcess.length}`;
    processButton.style.display = 'block';
    downloadLinksContainer.innerHTML = '';
}

async function processAndDownloadAll() {
    fileMessage.textContent = '';
    processButton.style.display = 'none';
    loadingMessage.classList.remove('hidden');

    downloadLinksContainer.innerHTML = '';
    
    for (const file of filesToProcess) {
        try {
            await processSingleFile(file);
        } catch (e) {
            console.error(`Dosya işlenirken bir sorun oluştu: ${file.name}`, e);
            const errorMessage = document.createElement('p');
            errorMessage.className = 'text-red-600 text-sm mt-2';
            errorMessage.textContent = `Hata: ${file.name} dosyası işlenemedi.`;
            downloadLinksContainer.appendChild(errorMessage);
        }
    }

    loadingMessage.classList.add('hidden');
    fileMessage.textContent = 'Tüm dosyalar başarıyla işlendi ve indirmeye hazır.';
    
    if (filesToProcess.length > 0) {
        processButton.style.display = 'block';
    }
}

function processSingleFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buffer = event.target.result;
                const zip = await JSZip.loadAsync(buffer);
                const jsonFile = zip.file("definition.json");

                if (!jsonFile) {
                    throw new Error("MOGRT dosyası içinde 'definition.json' bulunamadı.");
                }

                const jsonString = await jsonFile.async("string");
                const jsonObject = JSON.parse(jsonString);

                const updatedJson = window.processJson(jsonObject); 
                const updatedJsonString = JSON.stringify(updatedJson, null, 2);

                zip.file("definition.json", updatedJsonString);

                const updatedMogrtBlob = await zip.generateAsync({type:"blob"});
                const url = URL.createObjectURL(updatedMogrtBlob);
                
                const downloadLink = document.createElement('a');
                // Yeni sınıfımızı burada kullanıyoruz
                downloadLink.className = 'download-button'; 
                downloadLink.href = url;
                downloadLink.download = file.name;
                downloadLink.textContent = file.name; // Metin olarak dosya adını gösteriyoruz
                downloadLinksContainer.appendChild(downloadLink);
                
                resolve();
            } catch (e) {
                reject(e);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}