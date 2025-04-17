// Game data structures
const timPemain = {
    Mage: { 
        hp: 80, 
        maxHp: 80, 
        mana: 120, 
        maxMana: 120, 
        level: 1, 
        exp: 0, 
        skills: [
            { nama: "Fireball", damage: 25, manaCost: 20, description: "Serangan api yang kuat" },
            { nama: "Lightning Strike", damage: 35, manaCost: 30, description: "Serangan petir yang mematikan" }
        ]
    },
    Knight: { 
        hp: 150, 
        maxHp: 150, 
        mana: 50, 
        maxMana: 50, 
        level: 1, 
        exp: 0, 
        skills: [
            { nama: "Slash", damage: 20, manaCost: 10, description: "Tebasan cepat dengan pedang" },
            { nama: "Shield Bash", damage: 15, manaCost: 5, description: "Pukulan dengan perisai" }
        ]
    },
    Archer: { 
        hp: 100, 
        maxHp: 100, 
        mana: 80, 
        maxMana: 80, 
        level: 1, 
        exp: 0, 
        skills: [
            { nama: "Arrow Shot", damage: 18, manaCost: 8, description: "Tembakan panah akurat" },
            { nama: "Multi Shot", damage: 28, manaCost: 15, description: "Tembakan beberapa panah sekaligus" }
        ]
    },
    Healer: { 
        hp: 90, 
        maxHp: 90, 
        mana: 100, 
        maxMana: 100, 
        level: 1, 
        exp: 0, 
        skillCounter: 0, 
        skills: [
            { nama: "Holy Strike", damage: 15, manaCost: 10, description: "Serangan cahaya suci" },
            { nama: "Regen Mana", regen: 30, manaCost: 0, description: "Pulihkan mana setelah 3 serangan", onlyAfterThreeHits: true }
        ]
    }
};

const musuhList = {
    Goblin: { hp: 80, maxHp: 80, mana: 30, maxMana: 30, damage: 10, expReward: 50, description: "Makhluk kecil berwarna hijau" },
    Megablin: { hp: 120, maxHp: 120, mana: 40, maxMana: 40, damage: 15, expReward: 70, description: "Goblin yang lebih besar dan kuat" },
    Elf: { hp: 150, maxHp: 150, mana: 100, maxMana: 100, damage: 20, expReward: 100, description: "Peri hutan yang gesit" },
    Iblis: { hp: 200, maxHp: 200, mana: 150, maxMana: 150, damage: 25, expReward: 150, description: "Iblis dari dunia bawah" },
    RajaIblis: { hp: 300, maxHp: 300, mana: 300, maxMana: 300, damage: 30, expReward: 300, description: "Pemimpin para iblis" },
    FallenAngel: { hp: 300, maxHp: 300, mana: 400, maxMana: 400, damage: 35, expReward: 500, description: "Malaikat yang telah jatuh" }
};

// Game state variables
let karakterAktif = null;
let musuh = null;
let gameLog = [];
let battleCount = 0;
let gameStarted = false;

// Initialize game
function initGame() {
    // Reset team stats
    Object.keys(timPemain).forEach(nama => {
        const karakter = timPemain[nama];
        karakter.hp = karakter.maxHp;
        karakter.mana = karakter.maxMana;
        karakter.level = 1;
        karakter.exp = 0;
        if (nama === "Healer") {
            karakter.skillCounter = 0;
        }
    });
    
    pilihMusuhBaru();
    updateAllStats();
    addToGameLog("Petualangan dimulai! Pilih karakter untuk menyerang musuh.");
}

function pilihMusuhBaru() {
    const musuhKeys = Object.keys(musuhList);
    const difficulty = Math.min(Math.floor(battleCount / 3), musuhKeys.length - 1);
    
    // Choose a random enemy based on current difficulty
    const availableEnemies = musuhKeys.slice(0, difficulty + 1);
    const musuhTerpilih = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    
    // Deep copy the enemy template
    musuh = JSON.parse(JSON.stringify(musuhList[musuhTerpilih]));
    musuh.nama = musuhTerpilih;
    
    addToGameLog(`Kamu bertemu ${musuh.nama}! ${musuh.description}`);
}

function mulaiGame() {
    if (!gameStarted) {
        document.getElementById("pilihan-karakter").style.display = "block";
        document.getElementById("start-button").style.display = "none";
        initGame();
        gameStarted = true;
    }
}

function pilihKarakter(nama) {
    if (timPemain[nama].hp <= 0) {
        addToGameLog(`${nama} sudah mati dan tidak bisa menyerang!`);
        return;
    }
    
    karakterAktif = nama;
    document.getElementById("karakter-aktif").textContent = nama;
    updateSkills(nama);
    addToGameLog(`${nama} siap menyerang!`);
}

function updateSkills(nama) {
    const karakter = timPemain[nama];
    
    let skillButtons = karakter.skills.map((skill, index) => {
        let buttonText = `${skill.nama} (Mana: ${skill.manaCost})`;
        
        // damage information
        if (skill.damage) {
            buttonText += ` - Damage: ${skill.damage}`;
        }

        // add regen information
        if (skill.regen) {
            buttonText += ` - Regen: ${skill.regen}`;
        }

        let disabled = karakter.mana < skill.manaCost;

        // Special case for Healer's Regen Mana skill
        if (skill.nama === "Regen Mana" && (karakter.skillCounter < 3 || skill.onlyAfterThreeHits)) {
            disabled = true;
            buttonText += ` (${karakter.skillCounter}/3)`;
        }
        
        return `<button onclick="serangMusuh('${nama}', ${index})" ${disabled ? 'disabled' : ''} 
                title="${skill.description}">${buttonText}</button>`;
    }).join("");

    document.getElementById("action-buttons").innerHTML = `
        ${skillButtons}
        <button onclick="kabur()">Kabur</button>
    `;
}

function serangMusuh(nama, skillIndex) {
    const karakter = timPemain[nama];
    const skill = karakter.skills[skillIndex];

    if (karakter.mana < skill.manaCost) {
        addToGameLog("Mana tidak cukup!");
        return;
    }

    // Special case for Healer's Regen Mana skill
    if (skill.nama === "Regen Mana") {
        if (karakter.skillCounter < 3 && skill.onlyAfterThreeHits) {
            addToGameLog("Skill belum aktif. Butuh 3 serangan terlebih dahulu.");
            return;
        }
        
        // Reset counter and regenerate mana for all team members
        karakter.skillCounter = 0;
        Object.keys(timPemain).forEach(teammate => {
            if (timPemain[teammate].hp > 0) {
                timPemain[teammate].mana = Math.min(
                    timPemain[teammate].mana + skill.regen,
                    timPemain[teammate].maxMana
                );
            }
        });
        
        addToGameLog(`${nama} menggunakan ${skill.nama}! Mana tim dipulihkan sebanyak ${skill.regen} poin.`);
    } else {
        // Regular attack skill
        karakter.mana -= skill.manaCost;
        
        // Calculate damage with random variation
        const baseDamage = skill.damage;
        const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const actualDamage = Math.floor(baseDamage * randomFactor);
        
        musuh.hp = Math.max(0, musuh.hp - actualDamage);
        
        // Critical hit chance (10%)
        let criticalHit = Math.random() < 0.1;
        if (criticalHit) {
            const criticalDamage = Math.floor(actualDamage * 0.5);
            musuh.hp = Math.max(0, musuh.hp - criticalDamage);
            addToGameLog(`${nama} menggunakan ${skill.nama} dan menyerang ${musuh.nama} dengan ${actualDamage} damage! CRITICAL HIT! +${criticalDamage} damage!`);
        } else {
            addToGameLog(`${nama} menggunakan ${skill.nama} dan menyerang ${musuh.nama} dengan ${actualDamage} damage!`);
        }
        
        // Increment Healer's skill counter
        if (nama === "Healer") {
            karakter.skillCounter++;
            if (karakter.skillCounter >= 3) {
                addToGameLog(`${nama} bisa menggunakan Regen Mana sekarang!`);
                updateSkills(nama);
            }
        }
    }

    updateAllStats();

    // Check if enemy is defeated
    if (musuh.hp <= 0) {
        battleCount++;
        addToGameLog(`${musuh.nama} dikalahkan! Semua anggota tim mendapatkan EXP!`);
        bagiExp();
        
        // Show continue button
        document.getElementById("action-buttons").innerHTML = `
            <button onclick="lanjutBertarung()">Lanjut Bertarung</button>
            <button onclick="resetGame()">Akhiri Petualangan</button>
        `;
    } else {
        // Enemy's turn
        setTimeout(seranganMusuh, 1000);
    }
}

function seranganMusuh() {
    const karakterYangMasihHidup = Object.keys(timPemain).filter(nama => timPemain[nama].hp > 0);
    
    if (karakterYangMasihHidup.length === 0) {
        addToGameLog("Semua anggota tim telah kalah! Petualangan berakhir.");
        document.getElementById("action-buttons").innerHTML = `
            <button onclick="resetGame()">Mulai Petualangan Baru</button>
        `;
        return;
    }

    // Choose a random target
    const target = karakterYangMasihHidup[Math.floor(Math.random() * karakterYangMasihHidup.length)];
    
    // Calculate damage with random variation
    const baseDamage = musuh.damage;
    const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
    const actualDamage = Math.floor(baseDamage * randomFactor);
    
    timPemain[target].hp = Math.max(0, timPemain[target].hp - actualDamage);

    // Critical hit chance (10%)
    let criticalHit = Math.random() < 0.1;
    if (criticalHit) {
        const criticalDamage = Math.floor(actualDamage * 0.5);
        timPemain[target].hp = Math.max(0, timPemain[target].hp - criticalDamage);
        addToGameLog(`${musuh.nama} menyerang ${target} dengan ${actualDamage} damage! CRITICAL HIT! +${criticalDamage} damage!`);
    } else {
        addToGameLog(`${musuh.nama} menyerang ${target} dengan ${actualDamage} damage!`);
    }

    if (timPemain[target].hp <= 0) {
        addToGameLog(`${target} telah jatuh!`);
        
        // If active character died, reset action buttons
        if (target === karakterAktif) {
            document.getElementById("action-buttons").innerHTML = "";
            karakterAktif = null;
            document.getElementById("karakter-aktif").textContent = "Tidak ada";
            addToGameLog("Pilih karakter lain untuk melanjutkan pertarungan!");
        }
    }

    updateAllStats();
    
    // Check if all team members are dead
    if (Object.keys(timPemain).every(nama => timPemain[nama].hp <= 0)) {
        addToGameLog("Semua anggota tim telah kalah! Petualangan berakhir.");
        document.getElementById("action-buttons").innerHTML = `
            <button onclick="resetGame()">Mulai Petualangan Baru</button>
        `;
    }
}

function bagiExp() {
    Object.keys(timPemain).forEach(nama => {
        if (timPemain[nama].hp > 0) {
            timPemain[nama].exp += musuh.expReward;
            checkLevelUp(nama);
        }
    });
    
    updateAllStats();
}

function checkLevelUp(nama) {
    const karakter = timPemain[nama];
    let leveledUp = false;
    
    while (karakter.exp >= 100) {
        karakter.exp -= 100;
        karakter.level++;
        leveledUp = true;
        
        // Increase stats based on character type
        const hpIncrease = nama === "Knight" ? 30 : 20;
        const manaIncrease = nama === "Mage" ? 20 : 10;
        
        karakter.maxHp += hpIncrease;
        karakter.hp = karakter.maxHp; // Full heal on level up
        karakter.maxMana += manaIncrease;
        karakter.mana = karakter.maxMana; // Full mana on level up
        
        // Increase skill damage
        karakter.skills.forEach(skill => {
            if (skill.damage) {
                skill.damage = Math.floor(skill.damage * 1.2); // 20% damage increase per level
            }
            if (skill.regen) {
                skill.regen = Math.floor(skill.regen * 1.2); // 20% regen increase per level
            }
        });
        
        addToGameLog(`${nama} naik ke level ${karakter.level}! HP +${hpIncrease}, Mana +${manaIncrease}, Damage +20%`);
    }
    
    if (leveledUp) {
        // If character leveled up, update their skills
        if (nama === karakterAktif) {
            updateSkills(nama);
        }
    }
}

function lanjutBertarung() {
    pilihMusuhBaru();
    updateAllStats();
    
    // Reset active character
    karakterAktif = null;
    document.getElementById("karakter-aktif").textContent = "Tidak ada";
    document.getElementById("action-buttons").innerHTML = "";
    
    addToGameLog("Pilih karakter untuk melanjutkan pertarungan!");
}

function updateAllStats() {
    // Update player stats
    Object.keys(timPemain).forEach(nama => {
        const karakter = timPemain[nama];
        document.getElementById(`hp-${nama.toLowerCase()}`).textContent = karakter.hp;
        document.getElementById(`max-hp-${nama.toLowerCase()}`).textContent = karakter.maxHp;
        document.getElementById(`mana-${nama.toLowerCase()}`).textContent = karakter.mana;
        document.getElementById(`max-mana-${nama.toLowerCase()}`).textContent = karakter.maxMana;
        document.getElementById(`level-${nama.toLowerCase()}`).textContent = karakter.level;
        document.getElementById(`exp-${nama.toLowerCase()}`).textContent = karakter.exp;
        
        // update hp bar
        const hpBar = document.getElementById(`hp-bar-${nama.toLowerCase()}`);
        if (hpBar) {
            const hpPercentage = (karakter.hp / karakter.maxHp * 100).toFixed(2);
            hpBar.style.width = `${hpPercentage}%`;

            // ubah warna bar
            if (hpPercentage < 25) {
                hpBar.classList.add('danger');
                hpBar.classList.remove('warning');
            } else if (hpPercentage < 50) {
                hpBar.classList.add('warning');
                hpBar.classList.remove('danger');
            } else {
                hpBar.classList.remove('warning', 'danger');
            }
        }

        // update mana and other stats
        document.getElementById(`mana-${nama.toLowerCase()}`).textContent = karakter.mana;
        document.getElementById(`max-mana-${nama.toLowerCase()}`).textContent = karakter.maxMana;
        document.getElementById(`level-${nama.toLowerCase()}`).textContent = karakter.level;
        document.getElementById(`exp-${nama.toLowerCase()}`).textContent = karakter.exp;
        
        // Update character status UI
        const characterEl = document.getElementById(`status-${nama.toLowerCase()}`);
        if (characterEl) {
            if (karakter.hp <= 0) {
                characterEl.classList.add("defeated");
            } else {
                characterEl.classList.remove("defeated");
            }
        }
    });

    // Update enemy stats
    if (musuh) {
        document.getElementById("nama-musuh").textContent = musuh.nama;
        document.getElementById("hp-musuh").textContent = musuh.hp;
        document.getElementById("max-hp-musuh").textContent = musuh.maxHp;
        document.getElementById("mana-musuh").textContent = musuh.mana;
        document.getElementById("max-mana-musuh").textContent = musuh.maxMana;
    }
    
    // Update battle counter
    document.getElementById("battle-count").textContent = battleCount;
}

function addToGameLog(message) {
    gameLog.unshift(message); // Add to beginning of array
    if (gameLog.length > 10) {
        gameLog.pop(); // Remove oldest message if more than 10
    }
    
    const logElement = document.getElementById("game-log");
    logElement.innerHTML = gameLog.map(msg => `<p>${msg}</p>`).join("");
    
    // Also update the game text area
    document.getElementById("game-text").textContent = message;
}

function resetGame() {
    location.reload();
}

function kabur() {
    const escapeChance = 0.7; // 70% chance to escape
    
    if (Math.random() < escapeChance) {
        addToGameLog("Kamu berhasil kabur!");
        document.getElementById("action-buttons").innerHTML = `
            <button onclick="lanjutBertarung()">Lanjut Bertarung</button>
            <button onclick="resetGame()">Akhiri Petualangan</button>
        `;
    } else {
        addToGameLog("Kamu gagal kabur! Musuh menyerang!");
        setTimeout(seranganMusuh, 1000);
    }
}

// Initialize game when page loads
window.onload = function() {
    // Start with a welcome message
    document.getElementById("game-text").textContent = "Selamat datang di Ancient Hunter!";
};