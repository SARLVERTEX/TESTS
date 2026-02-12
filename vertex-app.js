// ============================================================================
// VERTEX MONACO V7.0 ULTIMATE - ARCHITECTURE MODULAIRE
// ============================================================================

const APP = {
    // Configuration
    config: {
        DB_NAME: 'VertexDB_V7',
        VERSION: 7,
        AUTO_SAVE_DELAY: 1000
    },

    // État global
    state: {
        currentStep: 0,
        currentEditId: null,
        currentFilter: 'tous',
        currentStockFilter: 'tous',
        autoSaveTimeout: null,
        lastSaveState: null
    },

    // Données
    db: {
        projects: [],
        stock: [],
        stockMovements: [],
        measures: []
    },

    // ========== INITIALISATION ==========
    init() {
        console.log('🚀 Vertex V7.0 Ultimate - Initialisation...');
        
        this.data.load();
        this.navigation.restore();
        this.ui.updateStats();
        
        // Setup auto-save
        window.addEventListener('beforeunload', () => {
            this.data.save();
        });

        // Setup drag & drop for photos
        this.measures.setupDragDrop();
        
        console.log('✅ Application prête');
    },

    // ========== MODULE: DATA ==========
    data: {
        load() {
            const stored = localStorage.getItem(APP.config.DB_NAME);
            if (stored) {
                try {
                    APP.db = JSON.parse(stored);
                    console.log('📦 Données chargées');
                } catch (e) {
                    console.error('❌ Erreur chargement:', e);
                }
            }
            
            // Ensure all arrays exist
            if (!APP.db.projects) APP.db.projects = [];
            if (!APP.db.stock) APP.db.stock = [];
            if (!APP.db.stockMovements) APP.db.stockMovements = [];
            if (!APP.db.measures) APP.db.measures = [];
        },

        save() {
            try {
                const data = JSON.stringify(APP.db);
                
                // Check if data changed
                if (data === APP.state.lastSaveState) return;
                
                localStorage.setItem(APP.config.DB_NAME, data);
                APP.state.lastSaveState = data;
                
                APP.ui.showAutoSave('saved');
                console.log('💾 Sauvegarde automatique');
            } catch (e) {
                console.error('❌ Erreur sauvegarde:', e);
                APP.ui.showToast('Erreur de sauvegarde', 'error');
            }
        },

        autoSave() {
            clearTimeout(APP.state.autoSaveTimeout);
            APP.ui.showAutoSave('saving');
            
            APP.state.autoSaveTimeout = setTimeout(() => {
                APP.data.save();
            }, APP.config.AUTO_SAVE_DELAY);
        },

        export() {
            const backup = {
                version: APP.config.VERSION,
                date: new Date().toISOString(),
                data: APP.db
            };
            
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Vertex_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            APP.ui.createConfetti(15);
            APP.ui.showToast('💾 Sauvegarde créée !', 'success');
        },

        reset() {
            if (!confirm('⚠️ ATTENTION: Supprimer toutes les données ?\nCette action est irréversible !')) return;
            if (!confirm('Êtes-vous vraiment sûr ?')) return;
            
            localStorage.removeItem(APP.config.DB_NAME);
            APP.db = { projects: [], stock: [], stockMovements: [], measures: [] };
            
            APP.ui.updateStats();
            APP.projects.render();
            APP.stock.render();
            APP.measures.renderSaved();
            
            APP.ui.showToast('🗑️ Données réinitialisées', 'warning');
            APP.navigation.goTo(0);
        }
    },

    // ========== MODULE: NAVIGATION ==========
    navigation: {
        goTo(step) {
            // Save current state
            localStorage.setItem('vertexCurrentStep', step);
            
            APP.state.currentStep = step;
            
            document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
            document.getElementById('step' + step).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Load data for specific steps
            if (step === 1) APP.projects.render();
            if (step === 2) {
                APP.stock.render();
                APP.stock.renderAlerts();
            }
            if (step === 5) APP.measures.renderSaved();
            
            APP.ui.createConfetti(5);
        },

        restore() {
            const saved = localStorage.getItem('vertexCurrentStep');
            if (saved) {
                const step = parseInt(saved);
                if (step !== 0) {
                    this.goTo(step);
                }
            }
        }
    },

    // ========== MODULE: UI ==========
    ui: {
        updateStats() {
            document.getElementById('statProjets').textContent = 
                APP.db.projects.filter(p => p.status !== 'termine').length;
            document.getElementById('statStock').textContent = APP.db.stock.length;
        },

        showToast(msg, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = msg;
            document.body.appendChild(toast);
            
            if (type === 'success') {
                APP.ui.createConfetti(5);
            }
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        createConfetti(count) {
            const colors = ['#D4AF37', '#ff4d4d', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
            
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 0.5 + 's';
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 2000);
                }, i * 50);
            }
        },

        showAutoSave(state) {
            const indicator = document.getElementById('autoSaveIndicator');
            const text = document.getElementById('autoSaveText');
            
            indicator.classList.remove('hidden', 'saving', 'saved');
            
            if (state === 'saving') {
                indicator.classList.add('saving');
                text.textContent = 'Sauvegarde...';
            } else if (state === 'saved') {
                indicator.classList.add('saved');
                text.textContent = '✓ Sauvegardé';
            }
            
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 2000);
        },

        openModal(id) {
            document.getElementById(id).classList.add('active');
        },

        closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }
    },

    // ========== MODULE: PROJETS ==========
    projects: {
        currentTab: 'list',

        switchTab(tab) {
            this.currentTab = tab;
            
            document.querySelectorAll('#step1 .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            document.querySelectorAll('#step1 .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (tab === 'list') {
                document.getElementById('tab-project-list').classList.add('active');
                this.render();
            } else if (tab === 'budget') {
                document.getElementById('tab-project-budget').classList.add('active');
                this.renderBudget();
            } else if (tab === 'timeline') {
                document.getElementById('tab-project-timeline').classList.add('active');
                this.renderTimeline();
            }
        },

        render() {
            const container = document.getElementById('projectsList');
            let projects = APP.db.projects;

            if (APP.state.currentFilter !== 'tous') {
                projects = projects.filter(p => p.status === APP.state.currentFilter);
            }

            if (projects.length === 0) {
                container.innerHTML = '<p class="text-center" style="color:#666; padding:40px 0;">Aucun projet</p>';
                return;
            }

            container.innerHTML = projects.map(project => {
                const statusBadges = {
                    nouveau: 'badge-info',
                    en_cours: 'badge-warning',
                    termine: 'badge-success'
                };

                const statusLabels = {
                    nouveau: 'Nouveau',
                    en_cours: 'En cours',
                    termine: 'Terminé'
                };

                const progress = project.progress || 0;

                return `
                    <div class="card" onclick="APP.projects.viewDetail('${project.id}')">
                        <div class="card-header">
                            <div class="card-title">${project.name}</div>
                            <span class="badge ${statusBadges[project.status]}">${statusLabels[project.status]}</span>
                        </div>
                        <div class="card-content">
                            <strong>Client:</strong> ${project.client}<br>
                            <strong>Dates:</strong> ${APP.utils.formatDate(project.startDate)} → ${APP.utils.formatDate(project.endDate)}<br>
                            <strong>Budget:</strong> ${APP.utils.formatCurrency(project.budget)}
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #888; margin-top: 10px;">
                                Avancement: ${progress}%
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderBudget() {
            const container = document.getElementById('projectBudgetView');
            
            const totalBudget = APP.db.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
            const activeProjects = APP.db.projects.filter(p => p.status !== 'termine');
            const activeBudget = activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
            
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${APP.utils.formatCurrency(totalBudget)}</div>
                        <div class="stat-label">Budget Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${APP.utils.formatCurrency(activeBudget)}</div>
                        <div class="stat-label">Budget En Cours</div>
                    </div>
                </div>
                
                <h3 style="color: var(--gold); margin: 30px 0 15px 0;">Répartition par projet</h3>
                
                ${APP.db.projects.map(project => `
                    <div class="card" style="cursor: default;">
                        <div class="card-header">
                            <div class="card-title">${project.name}</div>
                            <div style="font-size: 18px; font-weight: 900; color: var(--gold);">
                                ${APP.utils.formatCurrency(project.budget || 0)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
        },

        renderTimeline() {
            const container = document.getElementById('projectTimelineView');
            
            const sorted = [...APP.db.projects].sort((a, b) => 
                new Date(a.startDate) - new Date(b.startDate)
            );
            
            container.innerHTML = `
                <h3 style="color: var(--gold); margin-bottom: 15px;">Planning des projets</h3>
                
                ${sorted.map(project => {
                    const start = new Date(project.startDate);
                    const end = new Date(project.endDate);
                    const now = new Date();
                    const isLate = now > end && project.status !== 'termine';
                    
                    return `
                        <div class="card" style="cursor: default;">
                            <div class="card-header">
                                <div class="card-title">${project.name}</div>
                                ${isLate ? '<span class="badge badge-danger">EN RETARD</span>' : ''}
                            </div>
                            <div class="card-content">
                                <strong>Début:</strong> ${APP.utils.formatDate(project.startDate)}<br>
                                <strong>Fin prévue:</strong> ${APP.utils.formatDate(project.endDate)}<br>
                                <strong>Durée:</strong> ${Math.ceil((end - start) / (1000 * 60 * 60 * 24))} jours
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        },

        filter() {
            const search = document.getElementById('searchProjects').value.toLowerCase();
            const cards = document.querySelectorAll('#projectsList .card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(search) ? 'block' : 'none';
            });
        },

        filterByStatus(status) {
            APP.state.currentFilter = status;
            
            document.querySelectorAll('#step1 .filters .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            this.render();
        },

        openModal(id = null) {
            APP.state.currentEditId = id;
            const modal = document.getElementById('projectModal');
            
            if (id) {
                const project = APP.db.projects.find(p => p.id === id);
                document.getElementById('projectModalTitle').textContent = 'Modifier Projet';
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectClient').value = project.client;
                document.getElementById('projectPhone').value = project.phone;
                document.getElementById('projectEmail').value = project.email;
                document.getElementById('projectAddress').value = project.address;
                document.getElementById('projectStartDate').value = project.startDate;
                document.getElementById('projectEndDate').value = project.endDate;
                document.getElementById('projectBudget').value = project.budget;
                document.getElementById('projectStatus').value = project.status;
                document.getElementById('projectNotes').value = project.notes;
            } else {
                document.getElementById('projectModalTitle').textContent = 'Nouveau Projet';
                document.getElementById('projectName').value = '';
                document.getElementById('projectClient').value = '';
                document.getElementById('projectPhone').value = '';
                document.getElementById('projectEmail').value = '';
                document.getElementById('projectAddress').value = '';
                document.getElementById('projectStartDate').value = '';
                document.getElementById('projectEndDate').value = '';
                document.getElementById('projectBudget').value = '';
                document.getElementById('projectStatus').value = 'nouveau';
                document.getElementById('projectNotes').value = '';
            }
            
            modal.classList.add('active');
        },

        closeModal() {
            document.getElementById('projectModal').classList.remove('active');
            APP.state.currentEditId = null;
        },

        save() {
            const name = document.getElementById('projectName').value.trim();
            const client = document.getElementById('projectClient').value.trim();
            
            if (!name || !client) {
                APP.ui.showToast('⚠️ Nom et client requis', 'warning');
                return;
            }
            
            const project = {
                id: APP.state.currentEditId || APP.utils.generateId(),
                name: name,
                client: client,
                phone: document.getElementById('projectPhone').value.trim(),
                email: document.getElementById('projectEmail').value.trim(),
                address: document.getElementById('projectAddress').value.trim(),
                startDate: document.getElementById('projectStartDate').value,
                endDate: document.getElementById('projectEndDate').value,
                budget: parseFloat(document.getElementById('projectBudget').value) || 0,
                status: document.getElementById('projectStatus').value,
                notes: document.getElementById('projectNotes').value.trim(),
                progress: APP.state.currentEditId ? 
                    APP.db.projects.find(p => p.id === APP.state.currentEditId).progress : 0,
                dateCreated: APP.state.currentEditId ? 
                    APP.db.projects.find(p => p.id === APP.state.currentEditId).dateCreated : 
                    new Date().toISOString(),
                dateUpdated: new Date().toISOString()
            };
            
            if (APP.state.currentEditId) {
                const index = APP.db.projects.findIndex(p => p.id === APP.state.currentEditId);
                APP.db.projects[index] = project;
                APP.ui.showToast('✅ Projet modifié !', 'success');
            } else {
                APP.db.projects.push(project);
                APP.ui.showToast('🎉 Projet créé !', 'success');
                APP.ui.createConfetti(15);
            }
            
            APP.data.autoSave();
            APP.ui.updateStats();
            this.render();
            this.closeModal();
        },

        viewDetail(id) {
            const project = APP.db.projects.find(p => p.id === id);
            const content = document.getElementById('detailModalContent');
            
            const statusBadges = {
                nouveau: 'badge-info',
                en_cours: 'badge-warning',
                termine: 'badge-success'
            };
            
            const statusLabels = {
                nouveau: 'Nouveau',
                en_cours: 'En cours',
                termine: 'Terminé'
            };
            
            content.innerHTML = `
                <h3 class="modal-header">${project.name}</h3>
                <span class="badge ${statusBadges[project.status]}">${statusLabels[project.status]}</span>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: var(--gold); margin-bottom: 10px;">👤 Client</h4>
                    <p><strong>Nom:</strong> ${project.client}</p>
                    ${project.phone ? `<p><strong>Tél:</strong> ${project.phone}</p>` : ''}
                    ${project.email ? `<p><strong>Email:</strong> ${project.email}</p>` : ''}
                    ${project.address ? `<p><strong>Adresse:</strong> ${project.address}</p>` : ''}
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: var(--gold); margin-bottom: 10px;">📅 Planning</h4>
                    <p><strong>Début:</strong> ${APP.utils.formatDate(project.startDate)}</p>
                    <p><strong>Fin prévue:</strong> ${APP.utils.formatDate(project.endDate)}</p>
                    <p><strong>Avancement:</strong> ${project.progress}%</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: var(--gold); margin-bottom: 10px;">💰 Budget</h4>
                    <p style="font-size: 24px; font-weight: 900; color: var(--gold);">
                        ${APP.utils.formatCurrency(project.budget)}
                    </p>
                </div>
                
                ${project.notes ? `
                    <div style="margin-top: 20px;">
                        <h4 style="color: var(--gold); margin-bottom: 10px;">📝 Notes</h4>
                        <p style="white-space: pre-wrap;">${project.notes}</p>
                    </div>
                ` : ''}
                
                <div style="margin-top: 30px;">
                    <button class="btn-gold" onclick="APP.projects.updateProgress('${project.id}')">
                        📊 METTRE À JOUR L'AVANCEMENT
                    </button>
                    <button class="btn-outline" onclick="APP.projects.openModal('${project.id}'); APP.ui.closeModal('detailModal')">
                        ✏️ MODIFIER
                    </button>
                    <button class="btn-outline btn-danger" onclick="APP.projects.delete('${project.id}')">
                        🗑️ SUPPRIMER
                    </button>
                </div>
            `;
            
            APP.ui.openModal('detailModal');
        },

        updateProgress(id) {
            const progress = prompt('Avancement du projet (0-100%) :');
            if (progress === null) return;
            
            const value = parseInt(progress);
            if (isNaN(value) || value < 0 || value > 100) {
                APP.ui.showToast('⚠️ Valeur invalide', 'warning');
                return;
            }
            
            const project = APP.db.projects.find(p => p.id === id);
            project.progress = value;
            
            if (value === 100 && project.status !== 'termine') {
                project.status = 'termine';
                APP.ui.createConfetti(30);
                APP.ui.showToast('🎉 Projet terminé !', 'success');
            }
            
            APP.data.autoSave();
            APP.ui.updateStats();
            APP.ui.closeModal('detailModal');
            this.render();
        },

        delete(id) {
            if (!confirm('Supprimer ce projet ?')) return;
            
            APP.db.projects = APP.db.projects.filter(p => p.id !== id);
            APP.data.autoSave();
            APP.ui.updateStats();
            APP.ui.closeModal('detailModal');
            this.render();
            APP.ui.showToast('🗑️ Projet supprimé', 'success');
        }
    },

    // ========== MODULE: STOCK ==========
    stock: {
        currentTab: 'inventory',

        switchTab(tab) {
            this.currentTab = tab;
            
            document.querySelectorAll('#step2 .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            document.querySelectorAll('#step2 .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (tab === 'inventory') {
                document.getElementById('tab-stock-inventory').classList.add('active');
                this.render();
            } else if (tab === 'movements') {
                document.getElementById('tab-stock-movements').classList.add('active');
                this.renderMovements();
            } else if (tab === 'alerts') {
                document.getElementById('tab-stock-alerts').classList.add('active');
                this.renderAlerts();
            }
        },

        render() {
            const container = document.getElementById('stockList');
            let stock = APP.db.stock;

            if (APP.state.currentStockFilter !== 'tous') {
                stock = stock.filter(s => s.category === APP.state.currentStockFilter);
            }

            if (stock.length === 0) {
                container.innerHTML = '<p class="text-center" style="color:#666; padding:40px 0;">Aucun article</p>';
                return;
            }

            stock.sort((a, b) => a.name.localeCompare(b.name));

            container.innerHTML = stock.map(item => {
                const isLow = item.quantity <= item.alertThreshold;
                const isOut = item.quantity === 0;
                
                let statusBadge = '';
                if (isOut) {
                    statusBadge = '<span class="badge badge-danger">RUPTURE</span>';
                } else if (isLow) {
                    statusBadge = '<span class="badge badge-warning">STOCK BAS</span>';
                } else {
                    statusBadge = '<span class="badge badge-success">EN STOCK</span>';
                }

                const categoryIcons = {
                    materiaux: '🧱',
                    outils: '🔨',
                    quincaillerie: '🔩'
                };

                return `
                    <div class="card" onclick="APP.stock.viewDetail('${item.id}')">
                        <div class="card-header">
                            <div class="card-title">${categoryIcons[item.category]} ${item.name}</div>
                            ${statusBadge}
                        </div>
                        <div class="card-content">
                            <strong>Quantité:</strong> ${item.quantity} ${item.unit}<br>
                            <strong>Prix:</strong> ${APP.utils.formatCurrency(item.price)}<br>
                            ${item.reference ? `<strong>Réf:</strong> ${item.reference}<br>` : ''}
                            ${item.location ? `<strong>Emplacement:</strong> ${item.location}` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderMovements() {
            const container = document.getElementById('stockMovementsView');
            
            if (APP.db.stockMovements.length === 0) {
                container.innerHTML = '<p class="text-center" style="color:#666; padding:40px 0;">Aucun mouvement</p>';
                return;
            }
            
            const sorted = [...APP.db.stockMovements].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            container.innerHTML = `
                <h3 style="color: var(--gold); margin-bottom: 15px;">Historique des mouvements</h3>
                
                ${sorted.slice(0, 50).map(movement => {
                    const item = APP.db.stock.find(s => s.id === movement.itemId);
                    const itemName = item ? item.name : 'Article supprimé';
                    const typeLabel = movement.type === 'in' ? 'Entrée' : 'Sortie';
                    const badge = movement.type === 'in' ? 'badge-success' : 'badge-warning';
                    
                    return `
                        <div class="card" style="cursor: default;">
                            <div class="card-header">
                                <div class="card-title">${itemName}</div>
                                <span class="badge ${badge}">${typeLabel}</span>
                            </div>
                            <div class="card-content">
                                <strong>Quantité:</strong> ${movement.quantity} ${item ? item.unit : ''}<br>
                                <strong>Date:</strong> ${APP.utils.formatDate(movement.date)}<br>
                                ${movement.reason ? `<strong>Motif:</strong> ${movement.reason}` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        },

        renderAlerts() {
            const container = document.getElementById('stockAlertsView');
            const lowStock = APP.db.stock.filter(item => item.quantity <= item.alertThreshold && item.quantity > 0);
            const outStock = APP.db.stock.filter(item => item.quantity === 0);
            
            if (lowStock.length === 0 && outStock.length === 0) {
                container.innerHTML = '<p class="text-center" style="color:#666; padding:40px 0;">✅ Aucune alerte</p>';
                return;
            }
            
            let html = '';
            
            if (outStock.length > 0) {
                html += '<h3 style="color: var(--danger); margin-bottom: 15px;">🚨 Ruptures de stock</h3>';
                
                outStock.forEach(item => {
                    html += `
                        <div class="card" style="border-color: var(--danger); cursor: default;">
                            <div class="card-header">
                                <div class="card-title">${item.name}</div>
                                <button class="btn-small btn-gold" onclick="APP.stock.quickAdjust('${item.id}', 'in')">
                                    + AJOUTER
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (lowStock.length > 0) {
                html += '<h3 style="color: var(--warning); margin: 30px 0 15px 0;">⚠️ Stock bas</h3>';
                
                lowStock.forEach(item => {
                    html += `
                        <div class="card" style="border-color: var(--warning); cursor: default;">
                            <div class="card-header">
                                <div class="card-title">${item.name}</div>
                                <span style="color: #888;">${item.quantity} ${item.unit} restant${item.quantity > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            container.innerHTML = html;
        },

        filter() {
            const search = document.getElementById('searchStock').value.toLowerCase();
            const cards = document.querySelectorAll('#stockList .card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(search) ? 'block' : 'none';
            });
        },

        filterByCategory(category) {
            APP.state.currentStockFilter = category;
            
            document.querySelectorAll('#step2 .filters .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            this.render();
        },

        openModal(id = null) {
            APP.state.currentEditId = id;
            const modal = document.getElementById('stockModal');
            
            if (id) {
                const item = APP.db.stock.find(s => s.id === id);
                document.getElementById('stockModalTitle').textContent = 'Modifier Article';
                document.getElementById('stockName').value = item.name;
                document.getElementById('stockCategory').value = item.category;
                document.getElementById('stockReference').value = item.reference;
                document.getElementById('stockQuantity').value = item.quantity;
                document.getElementById('stockUnit').value = item.unit;
                document.getElementById('stockAlert').value = item.alertThreshold;
                document.getElementById('stockPrice').value = item.price;
                document.getElementById('stockSupplier').value = item.supplier;
                document.getElementById('stockLocation').value = item.location;
                document.getElementById('stockNotes').value = item.notes;
            } else {
                document.getElementById('stockModalTitle').textContent = 'Nouvel Article';
                document.getElementById('stockName').value = '';
                document.getElementById('stockCategory').value = 'materiaux';
                document.getElementById('stockReference').value = '';
                document.getElementById('stockQuantity').value = '';
                document.getElementById('stockUnit').value = '';
                document.getElementById('stockAlert').value = '';
                document.getElementById('stockPrice').value = '';
                document.getElementById('stockSupplier').value = '';
                document.getElementById('stockLocation').value = '';
                document.getElementById('stockNotes').value = '';
            }
            
            modal.classList.add('active');
        },

        closeModal() {
            document.getElementById('stockModal').classList.remove('active');
            APP.state.currentEditId = null;
        },

        save() {
            const name = document.getElementById('stockName').value.trim();
            
            if (!name) {
                APP.ui.showToast('⚠️ Nom requis', 'warning');
                return;
            }
            
            const item = {
                id: APP.state.currentEditId || APP.utils.generateId(),
                name: name,
                category: document.getElementById('stockCategory').value,
                reference: document.getElementById('stockReference').value.trim(),
                quantity: parseInt(document.getElementById('stockQuantity').value) || 0,
                unit: document.getElementById('stockUnit').value.trim() || 'pièce',
                alertThreshold: parseInt(document.getElementById('stockAlert').value) || 0,
                price: parseFloat(document.getElementById('stockPrice').value) || 0,
                supplier: document.getElementById('stockSupplier').value.trim(),
                location: document.getElementById('stockLocation').value.trim(),
                notes: document.getElementById('stockNotes').value.trim(),
                dateCreated: APP.state.currentEditId ? 
                    APP.db.stock.find(s => s.id === APP.state.currentEditId).dateCreated : 
                    new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            };
            
            if (APP.state.currentEditId) {
                const index = APP.db.stock.findIndex(s => s.id === APP.state.currentEditId);
                APP.db.stock[index] = item;
                APP.ui.showToast('✅ Article modifié !', 'success');
            } else {
                APP.db.stock.push(item);
                APP.ui.showToast('🎉 Article créé !', 'success');
                APP.ui.createConfetti(15);
            }
            
            APP.data.autoSave();
            APP.ui.updateStats();
            this.render();
            this.renderAlerts();
            this.closeModal();
        },

        viewDetail(id) {
            const item = APP.db.stock.find(s => s.id === id);
            const content = document.getElementById('detailModalContent');
            
            const isLow = item.quantity <= item.alertThreshold;
            const isOut = item.quantity === 0;
            
            let statusBadge = '';
            if (isOut) {
                statusBadge = '<span class="badge badge-danger">RUPTURE</span>';
            } else if (isLow) {
                statusBadge = '<span class="badge badge-warning">STOCK BAS</span>';
            } else {
                statusBadge = '<span class="badge badge-success">EN STOCK</span>';
            }

            const categoryLabels = {
                materiaux: '🧱 Matériaux',
                outils: '🔨 Outils',
                quincaillerie: '🔩 Quincaillerie'
            };
            
            const totalValue = item.quantity * item.price;
            
            content.innerHTML = `
                <h3 class="modal-header">${item.name}</h3>
                ${statusBadge}
                
                <div style="margin-top: 20px;">
                    <h4 style="color: var(--gold); margin-bottom: 10px;">📦 Informations</h4>
                    <p><strong>Catégorie:</strong> ${categoryLabels[item.category]}</p>
                    ${item.reference ? `<p><strong>Référence:</strong> ${item.reference}</p>` : ''}
                    <p><strong>Quantité:</strong> <span style="font-size: 24px; font-weight: 900; color: var(--gold);">
                        ${item.quantity} ${item.unit}
                    </span></p>
                    <p><strong>Seuil d'alerte:</strong> ${item.alertThreshold} ${item.unit}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: var(--gold); margin-bottom: 10px;">💰 Prix</h4>
                    <p><strong>Prix unitaire:</strong> ${APP.utils.formatCurrency(item.price)}</p>
                    <p><strong>Valeur stock:</strong> <span style="font-size: 20px; font-weight: 900; color: var(--gold);">
                        ${APP.utils.formatCurrency(totalValue)}
                    </span></p>
                </div>
                
                ${item.supplier ? `
                    <div style="margin-top: 20px;">
                        <h4 style="color: var(--gold); margin-bottom: 10px;">🏪 Fournisseur</h4>
                        <p>${item.supplier}</p>
                    </div>
                ` : ''}
                
                ${item.location ? `
                    <div style="margin-top: 20px;">
                        <h4 style="color: var(--gold); margin-bottom: 10px;">📍 Emplacement</h4>
                        <p>${item.location}</p>
                    </div>
                ` : ''}
                
                ${item.notes ? `
                    <div style="margin-top: 20px;">
                        <h4 style="color: var(--gold); margin-bottom: 10px;">📝 Notes</h4>
                        <p style="white-space: pre-wrap;">${item.notes}</p>
                    </div>
                ` : ''}
                
                <div style="margin-top: 30px; display: flex; gap: 10px;">
                    <button class="btn-outline" style="flex: 1;" onclick="APP.stock.quickAdjust('${item.id}', 'in')">
                        ➕ AJOUTER
                    </button>
                    <button class="btn-outline" style="flex: 1;" onclick="APP.stock.quickAdjust('${item.id}', 'out')">
                        ➖ RETIRER
                    </button>
                </div>
                
                <div style="margin-top: 10px;">
                    <button class="btn-outline" onclick="APP.stock.openModal('${item.id}'); APP.ui.closeModal('detailModal')">
                        ✏️ MODIFIER
                    </button>
                    <button class="btn-outline btn-danger" onclick="APP.stock.delete('${item.id}')">
                        🗑️ SUPPRIMER
                    </button>
                </div>
            `;
            
            APP.ui.openModal('detailModal');
        },

        quickAdjust(id, type) {
            const item = APP.db.stock.find(s => s.id === id);
            const label = type === 'in' ? 'ajouter' : 'retirer';
            
            const quantity = prompt(`Quantité à ${label} :`);
            if (quantity === null) return;
            
            const value = parseInt(quantity);
            if (isNaN(value) || value <= 0) {
                APP.ui.showToast('⚠️ Quantité invalide', 'warning');
                return;
            }
            
            if (type === 'out' && value > item.quantity) {
                APP.ui.showToast('⚠️ Quantité insuffisante', 'warning');
                return;
            }
            
            // Add movement
            APP.db.stockMovements.push({
                id: APP.utils.generateId(),
                itemId: item.id,
                type: type,
                quantity: value,
                date: new Date().toISOString(),
                reason: ''
            });
            
            // Update quantity
            if (type === 'in') {
                item.quantity += value;
                APP.ui.showToast(`✅ +${value} ${item.unit} ajouté${value > 1 ? 's' : ''} !`, 'success');
            } else {
                item.quantity -= value;
                APP.ui.showToast(`✅ -${value} ${item.unit} retiré${value > 1 ? 's' : ''} !`, 'success');
            }
            
            item.lastUpdate = new Date().toISOString();
            
            APP.data.autoSave();
            APP.ui.closeModal('detailModal');
            this.render();
            this.renderAlerts();
        },

        delete(id) {
            if (!confirm('Supprimer cet article ?')) return;
            
            APP.db.stock = APP.db.stock.filter(s => s.id !== id);
            APP.data.autoSave();
            APP.ui.updateStats();
            APP.ui.closeModal('detailModal');
            this.render();
            this.renderAlerts();
            APP.ui.showToast('🗑️ Article supprimé', 'success');
        }
    },

    // ========== MODULE: MESURES ==========
    measures: {
        canvas: null,
        ctx: null,
        currentTool: 'select',
        currentColor: '#D4AF37',
        isDrawing: false,
        isDragging: false,
        startX: 0,
        startY: 0,
        annotations: [],
        selectedAnnotation: null,
        tempAnnotation: null,
        baseImage: null,

        setupDragDrop() {
            const zone = document.getElementById('photoUploadZone');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    zone.style.borderColor = 'var(--gold)';
                    zone.style.background = 'var(--bg-light)';
                }, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => {
                    zone.style.borderColor = 'var(--border)';
                    zone.style.background = 'var(--card)';
                }, false);
            });
            
            zone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            }, false);
        },

        loadPhoto(input) {
            if (input.files && input.files[0]) {
                this.handleFile(input.files[0]);
            }
        },

        handleFile(file) {
            if (!file.type.startsWith('image/')) {
                APP.ui.showToast('⚠️ Fichier invalide', 'warning');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.baseImage = new Image();
                this.baseImage.onload = () => {
                    document.getElementById('photoUploadZone').classList.add('hidden');
                    document.getElementById('photoEditorContainer').classList.remove('hidden');
                    this.initCanvas();
                    APP.ui.showToast('✨ Photo chargée !', 'success');
                };
                this.baseImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        initCanvas() {
            this.canvas = document.getElementById('annotationCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            const maxWidth = 550;
            const scale = maxWidth / this.baseImage.width;
            this.canvas.width = this.baseImage.width * scale;
            this.canvas.height = this.baseImage.height * scale;
            
            this.annotations = [];
            this.selectedAnnotation = null;
            this.redraw();
            
            // Setup events
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
            this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
            this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
            this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
            
            // Select tool by default
            this.selectTool('select');
        },

        getMousePos(e) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            if (e.touches) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        },

        onMouseDown(e) {
            const pos = this.getMousePos(e);
            this.startX = pos.x;
            this.startY = pos.y;
            
            if (this.currentTool === 'select') {
                // Check if clicking on existing annotation
                this.selectedAnnotation = this.findAnnotationAt(pos.x, pos.y);
                
                if (this.selectedAnnotation) {
                    this.isDragging = true;
                    this.renderAnnotationsList();
                } else {
                    this.selectedAnnotation = null;
                    this.renderAnnotationsList();
                }
                this.redraw();
            } else if (this.currentTool === 'text') {
                const text = prompt('📝 Entrer le texte :');
                if (text) {
                    this.annotations.push({
                        type: 'text',
                        x: pos.x,
                        y: pos.y,
                        text: text,
                        color: this.currentColor
                    });
                    this.renderAnnotationsList();
                    this.redraw();
                    APP.ui.showToast('✨ Texte ajouté !', 'success');
                }
            } else {
                this.isDrawing = true;
            }
        },

        onMouseMove(e) {
            const pos = this.getMousePos(e);
            
            if (this.isDragging && this.selectedAnnotation) {
                // Move selected annotation
                const dx = pos.x - this.startX;
                const dy = pos.y - this.startY;
                
                if (this.selectedAnnotation.type === 'text') {
                    this.selectedAnnotation.x += dx;
                    this.selectedAnnotation.y += dy;
                } else {
                    this.selectedAnnotation.startX += dx;
                    this.selectedAnnotation.startY += dy;
                    this.selectedAnnotation.endX += dx;
                    this.selectedAnnotation.endY += dy;
                }
                
                this.startX = pos.x;
                this.startY = pos.y;
                this.redraw();
            } else if (this.isDrawing) {
                this.tempAnnotation = {
                    type: this.currentTool,
                    startX: this.startX,
                    startY: this.startY,
                    endX: pos.x,
                    endY: pos.y,
                    color: this.currentColor
                };
                
                this.redraw();
                this.drawAnnotation(this.tempAnnotation);
            }
        },

        onMouseUp(e) {
            if (this.isDragging) {
                this.isDragging = false;
                APP.data.autoSave();
            } else if (this.isDrawing) {
                this.isDrawing = false;
                
                if (this.tempAnnotation) {
                    if (this.currentTool === 'measure') {
                        const measure = prompt('📐 Entrer la mesure (ex: 2.80m) :');
                        if (measure) {
                            this.tempAnnotation.measure = measure.trim();
                            this.annotations.push(this.tempAnnotation);
                            this.renderAnnotationsList();
                            APP.ui.showToast(`✨ Mesure "${measure}" ajoutée !`, 'success');
                        }
                    } else {
                        this.annotations.push(this.tempAnnotation);
                        this.renderAnnotationsList();
                        APP.ui.showToast('✅ Annotation ajoutée !', 'success');
                    }
                    this.tempAnnotation = null;
                    this.redraw();
                    APP.data.autoSave();
                }
            }
        },

        onTouchStart(e) {
            e.preventDefault();
            this.onMouseDown(e);
        },

        onTouchMove(e) {
            e.preventDefault();
            this.onMouseMove(e);
        },

        onTouchEnd(e) {
            e.preventDefault();
            this.onMouseUp(e);
        },

        findAnnotationAt(x, y) {
            // Check in reverse order (top annotations first)
            for (let i = this.annotations.length - 1; i >= 0; i--) {
                const ann = this.annotations[i];
                
                if (ann.type === 'text') {
                    // Simple bounding box for text
                    const textWidth = this.ctx.measureText(ann.text).width;
                    if (x >= ann.x && x <= ann.x + textWidth &&
                        y >= ann.y - 20 && y <= ann.y + 5) {
                        return ann;
                    }
                } else {
                    // Check if near any point of the annotation
                    const threshold = 20;
                    if ((Math.abs(x - ann.startX) < threshold && Math.abs(y - ann.startY) < threshold) ||
                        (Math.abs(x - ann.endX) < threshold && Math.abs(y - ann.endY) < threshold)) {
                        return ann;
                    }
                }
            }
            return null;
        },

        selectTool(tool) {
            this.currentTool = tool;
            this.selectedAnnotation = null;
            
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
            
            // Update cursor
            if (tool === 'select') {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        },

        selectColor(color) {
            this.currentColor = color;
            
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            event.target.classList.add('active');
        },

        drawAnnotation(ann, isSelected = false) {
            this.ctx.strokeStyle = ann.color;
            this.ctx.fillStyle = ann.color;
            this.ctx.lineWidth = isSelected ? 6 : 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (isSelected) {
                this.ctx.shadowColor = ann.color;
                this.ctx.shadowBlur = 10;
            }
            
            switch (ann.type) {
                case 'arrow':
                    this.drawArrow(ann.startX, ann.startY, ann.endX, ann.endY);
                    break;
                case 'line':
                    this.ctx.beginPath();
                    this.ctx.moveTo(ann.startX, ann.startY);
                    this.ctx.lineTo(ann.endX, ann.endY);
                    this.ctx.stroke();
                    break;
                case 'measure':
                    this.drawMeasureLine(ann);
                    break;
                case 'rect':
                    this.ctx.strokeRect(ann.startX, ann.startY, ann.endX - ann.startX, ann.endY - ann.startY);
                    break;
                case 'circle':
                    const radius = Math.sqrt(Math.pow(ann.endX - ann.startX, 2) + Math.pow(ann.endY - ann.startY, 2));
                    this.ctx.beginPath();
                    this.ctx.arc(ann.startX, ann.startY, radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
                case 'text':
                    this.ctx.font = 'bold 24px "Darker Grotesque"';
                    this.ctx.fillText(ann.text, ann.x, ann.y);
                    break;
            }
            
            this.ctx.shadowBlur = 0;
        },

        drawArrow(x1, y1, x2, y2) {
            const headlen = 20;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
            this.ctx.stroke();
        },

        drawMeasureLine(ann) {
            this.ctx.beginPath();
            this.ctx.moveTo(ann.startX, ann.startY);
            this.ctx.lineTo(ann.endX, ann.endY);
            this.ctx.stroke();
            
            const perpAngle = Math.atan2(ann.endY - ann.startY, ann.endX - ann.startX) + Math.PI / 2;
            const capLength = 15;
            
            this.ctx.beginPath();
            this.ctx.moveTo(ann.startX + capLength * Math.cos(perpAngle), ann.startY + capLength * Math.sin(perpAngle));
            this.ctx.lineTo(ann.startX - capLength * Math.cos(perpAngle), ann.startY - capLength * Math.sin(perpAngle));
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(ann.endX + capLength * Math.cos(perpAngle), ann.endY + capLength * Math.sin(perpAngle));
            this.ctx.lineTo(ann.endX - capLength * Math.cos(perpAngle), ann.endY - capLength * Math.sin(perpAngle));
            this.ctx.stroke();
            
            if (ann.measure) {
                const midX = (ann.startX + ann.endX) / 2;
                const midY = (ann.startY + ann.endY) / 2;
                
                this.ctx.fillStyle = '#0A1929';
                this.ctx.fillRect(midX - 40, midY - 20, 80, 30);
                
                this.ctx.fillStyle = ann.color;
                this.ctx.font = 'bold 20px "Space Mono"';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(ann.measure, midX, midY);
            }
        },

        redraw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.baseImage) {
                this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            
            this.annotations.forEach(ann => {
                this.drawAnnotation(ann, ann === this.selectedAnnotation);
            });
        },

        renderAnnotationsList() {
            const list = document.getElementById('annotationsList');
            list.innerHTML = '';
            
            if (this.annotations.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#666; padding:20px 0;">Aucune annotation</p>';
                return;
            }
            
            this.annotations.forEach((ann, i) => {
                const label = ann.type === 'measure' && ann.measure ? 
                    `📐 ${ann.measure}` : 
                    `${this.getToolEmoji(ann.type)} ${ann.type}`;
                
                const isSelected = ann === this.selectedAnnotation ? 'selected' : '';
                
                list.innerHTML += `
                    <div class="annotation-item ${isSelected}" onclick="APP.measures.selectAnnotationFromList(${i})">
                        <div class="annotation-info">
                            <span style="color: ${ann.color};">●</span> ${label}
                        </div>
                        <button class="annotation-delete" onclick="event.stopPropagation(); APP.measures.deleteAnnotation(${i})">✕</button>
                    </div>
                `;
            });
        },

        selectAnnotationFromList(index) {
            this.selectedAnnotation = this.annotations[index];
            this.currentTool = 'select';
            this.selectTool('select');
            this.renderAnnotationsList();
            this.redraw();
        },

        getToolEmoji(type) {
            const emojis = {
                arrow: '➡️',
                line: '📏',
                measure: '📐',
                rect: '⬜',
                circle: '⭕',
                text: '📝',
                select: '👆'
            };
            return emojis[type] || '📌';
        },

        deleteAnnotation(index) {
            this.annotations.splice(index, 1);
            this.selectedAnnotation = null;
            this.renderAnnotationsList();
            this.redraw();
            APP.ui.showToast('🗑️ Annotation supprimée', 'success');
            APP.data.autoSave();
        },

        deleteSelected() {
            if (!this.selectedAnnotation) {
                APP.ui.showToast('⚠️ Aucune annotation sélectionnée', 'warning');
                return;
            }
            
            const index = this.annotations.indexOf(this.selectedAnnotation);
            if (index > -1) {
                this.deleteAnnotation(index);
            }
        },

        undo() {
            if (this.annotations.length === 0) {
                APP.ui.showToast('⚠️ Aucune annotation', 'warning');
                return;
            }
            this.annotations.pop();
            this.selectedAnnotation = null;
            this.renderAnnotationsList();
            this.redraw();
            APP.ui.showToast('↩️ Annulé', 'success');
            APP.data.autoSave();
        },

        clear() {
            if (this.annotations.length === 0) return;
            
            if (confirm('🗑️ Effacer toutes les annotations ?')) {
                this.annotations = [];
                this.selectedAnnotation = null;
                this.renderAnnotationsList();
                this.redraw();
                APP.ui.showToast('✨ Annotations effacées', 'success');
                APP.data.autoSave();
            }
        },

        save() {
            if (this.annotations.length === 0) {
                APP.ui.showToast('⚠️ Aucune annotation', 'warning');
                return;
            }
            
            const finalImage = this.canvas.toDataURL('image/jpeg', 0.9);
            
            APP.db.measures.push({
                id: APP.utils.generateId(),
                image: finalImage,
                annotations: this.annotations.length,
                date: new Date().toISOString()
            });
            
            APP.data.save();
            
            APP.ui.createConfetti(30);
            APP.ui.showToast('🎉 Photo enregistrée !', 'success');
            
            setTimeout(() => {
                document.getElementById('photoEditorContainer').classList.add('hidden');
                document.getElementById('photoUploadZone').classList.remove('hidden');
                document.getElementById('measurePhoto').value = '';
                this.renderSaved();
            }, 1500);
        },

        renderSaved() {
            const container = document.getElementById('savedMeasures');
            container.innerHTML = '';
            
            if (APP.db.measures.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#666; padding:40px 0;">Aucune mesure enregistrée</p>';
                return;
            }
            
            container.innerHTML = '<h3 style="color:var(--gold); margin:30px 0 20px 0;">📐 Mesures enregistrées</h3>';
            
            const sorted = [...APP.db.measures].reverse();
            
            sorted.forEach(measure => {
                container.innerHTML += `
                    <div class="card" style="cursor: default;">
                        <img src="${measure.image}" style="width:100%; border-radius:8px; margin-bottom:10px;">
                        <div style="font-size:12px; color:#888;">
                            ${measure.annotations} annotation${measure.annotations > 1 ? 's' : ''} • 
                            ${APP.utils.formatDate(measure.date)}
                        </div>
                    </div>
                `;
            });
        }
    },

    // ========== MODULE: UTILS ==========
    utils: {
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('fr-FR');
        },

        formatCurrency(value) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        }
    }
};

// ========== INITIALISATION ==========
window.addEventListener('load', () => {
    APP.init();
});
