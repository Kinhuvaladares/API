let clients = JSON.parse(localStorage.getItem('clients')) || [];
let currentClientIndex = null;
let selectedTab = null;
let replicateAppName = null;

document.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    if (!clients.length) {
        showInitialScreen();
    }

    // Initialize tabs on the secondary page
    const secondaryTabs = document.querySelectorAll('.tab-secondary');
    const secondaryContents = document.querySelectorAll('.tab-content-secondary');

    secondaryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = document.getElementById(tab.dataset.tab);

            secondaryTabs.forEach(t => t.classList.remove('active'));
            secondaryContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            target.classList.add('active');
        });
    });

    // Set the first tab as active
    secondaryTabs[0].classList.add('active');
    secondaryContents[0].classList.add('active');
});

function addClient() {
    const clientNameInput = document.getElementById('client-name');
    const clientName = clientNameInput.value.trim();
    if (clientName && clients.length < 100) {
        clients.push({
            name: clientName,
            versions: {
                'HostMng': { current: '1.0.0', final: '' },
                'Backoffice N3': { current: '3.0.0', final: '' },
                'PlazaMng': { current: '2.0.0', final: '' },
                'Backoffice N2': { current: '1.0.0', final: '' },
                'Lanecomms': { current: '1.0.0', final: '' },
                'Via': { current: '1.0.0', final: '' },
            },
        });
        localStorage.setItem('clients', JSON.stringify(clients));
        renderTabs();
        clientNameInput.value = '';
        document.getElementById('empty-state').style.display = 'none';
    } else {
        alert('Por favor, insira um nome de cliente válido.');
    }
}

function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = '';
    clients.sort((a, b) => a.name.localeCompare(b.name));
    clients.forEach((client, index) => {
        const tab = document.createElement('div');
        tab.classList.add('tab');
        tab.textContent = client.name;
        tab.addEventListener('click', () => {
            if (selectedTab === tab) {
                showInitialScreen();
                selectedTab.classList.remove('selected');
                selectedTab = null;
            } else {
                currentClientIndex = index;
                renderTabContents();
                if (selectedTab) {
                    selectedTab.classList.remove('selected');
                }
                tab.classList.add('selected');
                selectedTab = tab;
            }
        });
        tabsContainer.appendChild(tab);
    });
}

function renderTabContents() {
    const tabContentsContainer = document.getElementById('tab-contents');
    tabContentsContainer.innerHTML = '';

    if (currentClientIndex !== null) {
        const client = clients[currentClientIndex];

        const clientHeader = document.createElement('div');
        clientHeader.classList.add('client-header');
        clientHeader.innerHTML = `
            <h2>${client.name}</h2>
            <div class="client-actions">
                <button class="botao" onclick="editClientName()">Renomear</button>
                <button class="botao" onclick="deleteClient()">Excluir</button>
            </div>
        `;
        clientHeader.addEventListener('click', () => {
            showClientContent();
        });
        tabContentsContainer.appendChild(clientHeader);

        const clientContent = document.createElement('div');
        clientContent.classList.add('client-content');
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Aplicação</th>
                <th>Versão Final</th>
                <th>Versão Atual</th>
                <th class="edit-column">Ações</th>
            </tr>
        `;
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (const app in client.versions) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app}</td>
                <td>${client.versions[app].final}</td>
                <td>${client.versions[app].current}</td>
                <td class="actions edit-column">
                    <button class="botao edit-button" onclick="updateVersion('${app}', 'final')">Editar Final</button>
                    <button class="botao edit-button" onclick="updateVersion('${app}', 'current')">Editar Atual</button>
                </td>
            `;
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        clientContent.appendChild(table);
        tabContentsContainer.appendChild(clientContent);

        // Adicionar botão de replicar ao lado do primeiro botão "Editar Final"
        const firstEditFinalButton = clientContent.querySelector('.edit-button:nth-of-type(2)');
        if (firstEditFinalButton) {
            const replicateButton = document.createElement('button');
            replicateButton.textContent = 'Replicar';
            replicateButton.classList.add('botao', 'replicate-button');
            replicateButton.style.display = 'none';
            replicateButton.onclick = () => toggleReplicateModal();
            firstEditFinalButton.parentElement.appendChild(replicateButton);
        }

        // Adicionar campo de texto abaixo da tabela de versões
        const textInput = document.createElement('textarea');
        textInput.placeholder = 'Digite até 10000 caracteres';
        textInput.maxLength = 10000;
        textInput.classList.add('tab-text-input');
        textInput.value = client.userInput || ''; // Preenche com o valor salvo, se existir
        tabContentsContainer.appendChild(textInput);

        // Adicionar botão para salvar
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Salvar';
        saveButton.classList.add('save-button'); // Adiciona a nova classe CSS ao botão
        saveButton.onclick = () => {
            saveTextInput(textInput.value); // Chama a função para salvar o texto digitado
        };
        tabContentsContainer.appendChild(saveButton);

        // Exibir a opção de habilitar edição
        document.getElementById('edit-options-container').style.display = 'flex';
    }

    document.getElementById('empty-state').style.display = 'none'; // Oculta o estado vazio quando há clientes
    toggleButtons(false); // Desabilitar edição inicialmente
}

function toggleReplicateModal() {
    const modal = document.getElementById('replicate-modal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
        const clientSelectionContainer = document.getElementById('client-selection');
        clientSelectionContainer.innerHTML = '';
        clients.forEach((client, index) => {
            if (index !== currentClientIndex) { // Excluir o cliente atual da lista
                const option = document.createElement('div');
                option.classList.add('checkbox');
                option.innerHTML = `
                    <input type="checkbox" id="client-${index}" value="${index}">
                    <label for="client-${index}">${client.name}</label>
                `;
                clientSelectionContainer.appendChild(option);
            }
        });

        const replicateOptionsContainer = document.getElementById('replicate-options');
        replicateOptionsContainer.innerHTML = '';
        const client = clients[currentClientIndex];
        Object.keys(client.versions).forEach(app => {
            const option = document.createElement('div');
            option.classList.add('checkbox');
            option.innerHTML = `
                <input type="checkbox" id="app-${app}" value="${app}">
                <label for="app-${app}">${app}</label>
            `;
            replicateOptionsContainer.appendChild(option);
        });
    }
}

function confirmReplication() {
    const selectedClientsCheckboxes = document.querySelectorAll('#client-selection input[type="checkbox"]:checked');
    const selectedClients = Array.from(selectedClientsCheckboxes).map(cb => parseInt(cb.value));
    const selectedAppsCheckboxes = document.querySelectorAll('#replicate-options input[type="checkbox"]:checked');
    const selectedApps = Array.from(selectedAppsCheckboxes).map(cb => cb.value);

    selectedClients.forEach(clientIndex => {
        selectedApps.forEach(appName => {
            clients[clientIndex].versions[appName].final = clients[currentClientIndex].versions[appName].final;
        });
    });
    localStorage.setItem('clients', JSON.stringify(clients));
    toggleReplicateModal();
    renderTabContents();
}

function toggleButtons(toggle = true) {
    const isChecked = toggle ? document.getElementById('toggle-buttons').checked : false;
    const columns = document.querySelectorAll('.edit-column');
    columns.forEach(column => {
        column.style.display = isChecked ? '' : 'none';
    });
    const replicateButton = document.querySelector('.replicate-button');
    if (replicateButton) {
        replicateButton.style.display = isChecked ? 'inline-block' : 'none';
    }
}

function saveTextInput(text) {
    if (currentClientIndex !== null) {
        clients[currentClientIndex].userInput = text;
        localStorage.setItem('clients', JSON.stringify(clients));
        alert('Texto salvo com sucesso!');
    }
}

function showClientContent() {
    const clientContent = document.querySelector('.client-content');
    if (clientContent) {
        clientContent.classList.toggle('active');
    }
}

function editClientName() {
    const newName = prompt('Digite o novo nome do cliente:');
    if (newName) {
        clients[currentClientIndex].name = newName;
        localStorage.setItem('clients', JSON.stringify(clients));
        renderTabs();
        renderTabContents();
    }
}

function deleteClient() {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        clients.splice(currentClientIndex, 1);
        localStorage.setItem('clients', JSON.stringify(clients));
        currentClientIndex = null;
        renderTabs();
        renderTabContents();
        showInitialScreen();
    }
}

function updateVersion(appName, versionType) {
    const client = clients[currentClientIndex];
    const currentVersion = client.versions[appName][versionType];
    const newVersion = prompt(`Digite a nova versão para ${appName}:`, currentVersion);
    if (newVersion) {
        client.versions[appName][versionType] = newVersion;
        localStorage.setItem('clients', JSON.stringify(clients));
        renderTabContents();
    }
}

function showInitialScreen() {
    const tabContentsContainer = document.getElementById('tab-contents');
    tabContentsContainer.innerHTML = '';

    const emptyState = document.getElementById('empty-state');
    emptyState.style.display = 'block';

    // Ocultar a opção de habilitar edição
    document.getElementById('edit-options-container').style.display = 'none';
}

function closeUpdateForm() {
    document.getElementById('update-form').classList.remove('active');
}

function confirmUpdate() {
    const appNameInput = document.getElementById('app-name');
    const appVersionInput = document.getElementById('app-version');
    if (appNameInput.value && appVersionInput.value) {
        updateVersion(appNameInput.value, appVersionInput.value);
        closeUpdateForm();
    } else {
        alert('Por favor, preencha todos os campos.');
    }
}

function formatXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const serializer = new XMLSerializer();
    const formattedXMLString = serializer.serializeToString(xmlDoc)
        .replace(/(>)(<)(\/*)/g, '$1\n$2$3') // Adiciona quebras de linha entre tags
        .replace(/(<\w+)(.*?)(\/>)/g, '$1$2\n$3'); // Adiciona nova linha após tags auto-fechadas

    return formattedXMLString;
}

function exportToXML() {
    const xmlDocument = document.implementation.createDocument('', '', null);
    const rootElement = xmlDocument.createElement('ClientsData');
    xmlDocument.appendChild(rootElement);

    clients.forEach(client => {
        const clientElement = xmlDocument.createElement('Client');
        clientElement.setAttribute('name', client.name);

        const versionsElement = xmlDocument.createElement('Versions');
        Object.entries(client.versions).forEach(([app, version]) => {
            const versionElement = xmlDocument.createElement('Version');
            versionElement.setAttribute('app', app);
            versionElement.setAttribute('current', version.current);
            versionElement.setAttribute('final', version.final);
            versionsElement.appendChild(versionElement);
        });
        clientElement.appendChild(versionsElement);

        if (client.userInput) {
            const userInputElement = xmlDocument.createElement('UserInput');
            userInputElement.textContent = client.userInput;
            clientElement.appendChild(userInputElement);
        }

        rootElement.appendChild(clientElement);
    });

    const xmlString = new XMLSerializer().serializeToString(xmlDocument);
    const formattedXMLString = formatXML(xmlString);

    const blob = new Blob([formattedXMLString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientsData.xml';
    document.body.appendChild(link); // Adiciona o link ao DOM
    link.click();
    document.body.removeChild(link); // Remove o link do DOM
    URL.revokeObjectURL(url);
}

function importFromXML(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'application/xml');
            const clientsData = [];

            const clientElements = xmlDoc.getElementsByTagName('Client');
            for (const clientElement of clientElements) {
                const clientName = clientElement.getAttribute('name');
                const versions = {};
                const versionElements = clientElement.getElementsByTagName('Version');
                for (const versionElement of versionElements) {
                    const app = versionElement.getAttribute('app');
                    const current = versionElement.getAttribute('current');
                    const final = versionElement.getAttribute('final');
                    versions[app] = { current, final };
                }
                const userInputElement = clientElement.getElementsByTagName('UserInput')[0];
                const userInput = userInputElement ? userInputElement.textContent : '';

                clientsData.push({ name: clientName, versions, userInput });
            }

            clients = clientsData;
            localStorage.setItem('clients', JSON.stringify(clients));
            renderTabs();
            renderTabContents();
        };
        reader.readAsText(file);
    }
}

function toggleMode() {
    const root = document.documentElement;
    const currentBgColor = getComputedStyle(root).getPropertyValue('--background-dark').trim();

    if (currentBgColor === '#222') {
        root.style.setProperty('--background-dark', '#d0e8f2');
        root.style.setProperty('--text-light', '#333'); // Text color for light mode
        root.style.setProperty('--button-bg-dark', '#2196f3');
        root.style.setProperty('--header-bg-dark', '#2196f3');
        root.style.setProperty('--header-text-light', '#fff');
        root.style.setProperty('--client-header-bg-dark', '#e0f7fa');
        root.style.setProperty('--client-header-border-dark', '#ccc');
        root.style.setProperty('--tab-bg-dark', '#2196f3');
        root.style.setProperty('--tab-text-dark', '#fff');
        root.style.setProperty('--even-row-bg-dark', '#e0f7fa');
        root.style.setProperty('--border-color-dark', '#ccc');
        root.style.setProperty('--hover-border-dark', '#1e88e5');
    } else {
        root.style.setProperty('--background-dark', '#222');
        root.style.setProperty('--text-light', '#fff'); // Text color for dark mode
        root.style.setProperty('--button-bg-dark', '#000');
        root.style.setProperty('--header-bg-dark', '#555');
        root.style.setProperty('--header-text-light', '#fff');
        root.style.setProperty('--client-header-bg-dark', '#333');
        root.style.setProperty('--client-header-border-dark', '#666');
        root.style.setProperty('--tab-bg-dark', '#000');
        root.style.setProperty('--tab-text-dark', '#fff');
        root.style.setProperty('--even-row-bg-dark', '#333');
        root.style.setProperty('--border-color-dark', '#666');
        root.style.setProperty('--hover-border-dark', '#ffd700');
    }

    // Alterna os estilos dos botões
    document.querySelectorAll('.botao, .add-client-button, .save-button, .xml-buttons-top button, .close-modal').forEach(button => {
        button.style.backgroundColor = getComputedStyle(root).getPropertyValue('--button-bg-dark');
        button.style.color = getComputedStyle(root).getPropertyValue('--button-color-dark');
        button.style.borderColor = getComputedStyle(root).getPropertyValue('--border-color-dark');
    });

    // Alterna os estilos do texto
    document.querySelectorAll('th, td, .client-header h2').forEach(text => {
        text.style.color = getComputedStyle(root).getPropertyValue('--text-light');
        text.style.borderColor = getComputedStyle(root).getPropertyValue('--border-color-dark');
    });
}

function saveContent(tabId) {
    const fileInput = document.getElementById(`${tabId}-file`);
    const textArea = document.getElementById(`${tabId}-text`);
    
    // Save the content (e.g., to localStorage, or send to server)
    const files = Array.from(fileInput.files);
    const text = textArea.value;

    // For now, just log the content
    console.log(`Saving content for ${tabId}`);
    console.log('Files:', files);
    console.log('Text:', text);

    alert(`Conteúdo da aba ${tabId} salvo!`);
}
