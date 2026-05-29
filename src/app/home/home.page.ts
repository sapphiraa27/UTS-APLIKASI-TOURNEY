import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

// Interfaces for our tournament data models
export interface Player {
  id: string;
  name: string;
  number: string | number | null;
}

export interface Team {
  id: string;
  name: string;
  captain: string;
  contact: string;
  players: Player[];
  status: 'Pending' | 'Verified';
  registeredDate: string;
  ownerUser?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location: string;
  homeScore?: number;
  awayScore?: number;
  homeHalf1?: number;
  awayHalf1?: number;
  homeHalf2?: number;
  awayHalf2?: number;
  status: 'Upcoming' | 'Live' | 'Finished';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'alert' | 'success';
}

// IN-APP CHAT (SIMULATION)
export interface ChatMessage {
  id: string;
  sender: string;
  role: 'Admin' | 'User';
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  // Global UI State
  showSplash = true;
  isLoading = true;
  isDarkMode = false;
  viewMode: 'matches' | 'teams' | 'register' | 'profile' = 'matches';
  matchSubView: 'schedule' | 'bracket' = 'schedule';
  
  // ===== SPORT PRESETS ===== //
  sportPresets: { [key: string]: { label: string; icon: string; periodLabel: string; periods: number; periodDuration: number; breakDuration: number; breakLabel: string; scoreLabel: string; playerLabel: string; } } = {
    'futsal': { label: 'Futsal', icon: 'football-outline', periodLabel: 'Babak', periods: 2, periodDuration: 20, breakDuration: 10, breakLabel: 'HT', scoreLabel: 'Gol', playerLabel: 'No. Punggung' },
    'sepakbola': { label: 'Sepak Bola', icon: 'football-outline', periodLabel: 'Babak', periods: 2, periodDuration: 45, breakDuration: 15, breakLabel: 'HT', scoreLabel: 'Gol', playerLabel: 'No. Punggung' },
    'basket': { label: 'Bola Basket', icon: 'basketball-outline', periodLabel: 'Quarter', periods: 4, periodDuration: 10, breakDuration: 2, breakLabel: 'Break', scoreLabel: 'Poin', playerLabel: 'No. Punggung' },
    'voli': { label: 'Bola Voli', icon: 'tennisball-outline', periodLabel: 'Set', periods: 3, periodDuration: 0, breakDuration: 0, breakLabel: '-', scoreLabel: 'Poin', playerLabel: 'No. Punggung' },
    'badminton': { label: 'Badminton', icon: 'tennisball-outline', periodLabel: 'Game', periods: 3, periodDuration: 0, breakDuration: 0, breakLabel: '-', scoreLabel: 'Poin', playerLabel: 'No. Urut' },
    'tenismeja': { label: 'Tenis Meja', icon: 'tennisball-outline', periodLabel: 'Game', periods: 5, periodDuration: 0, breakDuration: 0, breakLabel: '-', scoreLabel: 'Poin', playerLabel: 'No. Urut' },
    'custom': { label: 'Lainnya', icon: 'trophy-outline', periodLabel: 'Babak', periods: 2, periodDuration: 30, breakDuration: 5, breakLabel: 'Jeda', scoreLabel: 'Skor', playerLabel: 'No.' }
  };

  // Tournament Configuration (Dynamic)
  tournamentConfig: {
    name: string;
    subtitle: string;
    sportType: string;
    periodLabel: string;
    periods: number;
    periodDuration: number;
    breakDuration: number;
    breakLabel: string;
    scoreLabel: string;
    playerLabel: string;
    sportIcon: string;
  } = {
    name: 'TURNAMEN OLAHRAGA 2026',
    subtitle: 'Turnamen Olahraga Lokal',
    sportType: 'futsal',
    periodLabel: 'Babak',
    periods: 2,
    periodDuration: 20,
    breakDuration: 10,
    breakLabel: 'HT',
    scoreLabel: 'Gol',
    playerLabel: 'No. Punggung',
    sportIcon: 'football-outline'
  };
  
  // User Authentication State
  isUserLoggedIn = false;
  isAuthModalOpen = false;
  userAuthMode: 'login' | 'register' | 'forgot' = 'login';
  authUsername = '';
  authPassword = '';
  currentUserName = '';
  
  // Forgot Password Temp State
  forgotUsername = '';
  forgotPassword = '';
  forgotConfirm = '';
  
  // Notifications State
  isNotifModalOpen = false;
  
  // Admin State
  isAdminMode = false;
  isAdminAuthOpen = false;
  adminPIN = '';

  // Chat State
  isChatModalOpen = false;
  chatInput = '';
  chatMessages: ChatMessage[] = [];

  // Tournament Bracket
  // Match duration (computed from config)
  get HALF_DURATION() { return this.tournamentConfig.periodDuration; }
  get BREAK_DURATION() { return this.tournamentConfig.breakDuration; }
  get TOTAL_MATCH_DURATION() { return (this.tournamentConfig.periodDuration * this.tournamentConfig.periods) + this.tournamentConfig.breakDuration; }

  /** Helper: Get formatted duration string for display */
  getMatchDurationLabel(): string {
    const cfg = this.tournamentConfig;
    if (cfg.periodDuration <= 0) return `Best of ${cfg.periods}`;
    return `${cfg.periods}×${cfg.periodDuration} min`;
  }

  /** Helper: Apply sport preset to tournament config */
  applySportPreset(sportKey: string) {
    const preset = this.sportPresets[sportKey];
    if (!preset) return;
    this.tournamentConfig.sportType = sportKey;
    this.tournamentConfig.periodLabel = preset.periodLabel;
    this.tournamentConfig.periods = preset.periods;
    this.tournamentConfig.periodDuration = preset.periodDuration;
    this.tournamentConfig.breakDuration = preset.breakDuration;
    this.tournamentConfig.breakLabel = preset.breakLabel;
    this.tournamentConfig.scoreLabel = preset.scoreLabel;
    this.tournamentConfig.playerLabel = preset.playerLabel;
    this.tournamentConfig.sportIcon = preset.icon;
  }

  bracket: any = {
    quarterFinals: [
      { id: 'QF1', home: 'FC Barcelona', away: 'Real Madrid', homeHalf1: 2, awayHalf1: 0, homeHalf2: 1, awayHalf2: 1, homeScore: 3, awayScore: 1, done: true },
      { id: 'QF2', home: 'Bhinneka FC', away: 'Garuda Muda', homeHalf1: 1, awayHalf1: 2, homeHalf2: 1, awayHalf2: 2, homeScore: 2, awayScore: 4, done: true },
      { id: 'QF3', home: 'Elang Jaya', away: 'Satria Muda', homeHalf1: 3, awayHalf1: 1, homeHalf2: 2, awayHalf2: 1, homeScore: 5, awayScore: 2, done: true },
      { id: 'QF4', home: 'Rajawali FC', away: 'Merpati', homeHalf1: 0, awayHalf1: 2, homeHalf2: 0, awayHalf2: 1, homeScore: 0, awayScore: 3, done: true }
    ],
    semiFinals: [
      { id: 'SF1', home: 'FC Barcelona', away: 'Garuda Muda', homeHalf1: 1, awayHalf1: 1, homeHalf2: 1, awayHalf2: 2, homeScore: 2, awayScore: 3, done: true },
      { id: 'SF2', home: 'Elang Jaya', away: 'Merpati', homeHalf1: 0, awayHalf1: 0, homeHalf2: 1, awayHalf2: 0, homeScore: 1, awayScore: 0, done: true }
    ],
    final: { id: 'F1', home: 'Garuda Muda', away: 'Elang Jaya', homeHalf1: 2, awayHalf1: 1, homeHalf2: 1, awayHalf2: 1, homeScore: 3, awayScore: 2, done: true },
    thirdPlace: { id: 'TP', home: 'FC Barcelona', away: 'Merpati', homeHalf1: 3, awayHalf1: 2, homeHalf2: 2, awayHalf2: 2, homeScore: 5, awayScore: 4, done: true }
  };

  /**
   * Cek apakah bracket sudah ditentukan oleh admin (tidak lagi TBD).
   */
  isBracketDetermined(): boolean {
    return this.bracket && 
           this.bracket.quarterFinals && 
           this.bracket.quarterFinals[0] && 
           this.bracket.quarterFinals[0].home !== 'TBD';
  }

  shuffleTournament() {
    if (!this.isAdminMode) return;
    
    const verifiedTeams = this.teams.filter(t => t.status === 'Verified');
    if (verifiedTeams.length < 8) {
      this.showToast('Minimal harus ada 8 tim yang diverifikasi untuk mengacak bracket!');
      return;
    }

    Swal.fire({
      title: 'Konfigurasi Turnamen',
      html: `
        <div class="swal-luxury-form">
          <!-- LOKASI -->
          <div class="form-group">
            <label><ion-icon name="location-outline"></ion-icon> Lokasi Pertandingan</label>
            <div class="lux-input-group">
              <input id="simLoc" type="text" placeholder="Contoh: Arena Olahraga" value="Arena Olahraga">
            </div>
          </div>

          <div style="display:flex; gap:15px;">
            <!-- TANGGAL -->
            <div class="form-group" style="flex:1">
              <label><ion-icon name="calendar-clear-outline"></ion-icon> Tanggal</label>
              <div class="lux-input-group">
                <input id="simDate" type="date" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>
            <!-- JAM -->
            <div class="form-group" style="flex:1">
              <label><ion-icon name="time-outline"></ion-icon> Jam Mulai</label>
              <div class="lux-input-group">
                <input id="simStart" type="time" value="${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}">
              </div>
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🚀 Mulai Turnamen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      preConfirm: () => {
        return {
          location: (document.getElementById('simLoc') as HTMLInputElement).value,
          date: (document.getElementById('simDate') as HTMLInputElement).value,
          startTime: (document.getElementById('simStart') as HTMLInputElement).value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { location, date, startTime } = result.value;
        const shuffled = [...verifiedTeams].sort(() => Math.random() - 0.5);
        
        // Helper to increment time (85 min per match = 40+5+40)
        let currentSimTime = new Date(`${date}T${startTime}`);
        const getNextTime = () => {
          const timeStr = currentSimTime.toTimeString().substring(0, 5);
          currentSimTime.setMinutes(currentSimTime.getMinutes() + this.TOTAL_MATCH_DURATION);
          return timeStr;
        };

        // 1. Reset Matches
        this.matches = [];

        // 2. Assign to Bracket Quarter Finals
        this.bracket.quarterFinals = [
          { id: 'QF1', home: shuffled[0].name, away: shuffled[1].name, homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location },
          { id: 'QF2', home: shuffled[2].name, away: shuffled[3].name, homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location },
          { id: 'QF3', home: shuffled[4].name, away: shuffled[5].name, homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location },
          { id: 'QF4', home: shuffled[6].name, away: shuffled[7].name, homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location }
        ];

        // 3. Pre-schedule SF and Finals with Meta
        this.bracket.semiFinals = [
          { id: 'SF1', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location },
          { id: 'SF2', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location }
        ];
        
        this.bracket.thirdPlace = { id: 'TP', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location };
        this.bracket.final = { id: 'F1', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false, time: getNextTime(), date: date, location: location };
        
        // Push Notification to all users
        const newNotif: AppNotification = {
          id: 'N-' + Date.now().toString(),
          title: '🏆 Bagan Turnamen Rilis!',
          message: 'Bagan pertandingan (bracket) resmi telah diacak dan ditetapkan oleh Panitia. Silakan periksa jadwal dan lawan tim Anda di menu Matches sekarang juga!',
          date: new Date().toISOString(),
          type: 'success'
        };
        this.notifications.unshift(newNotif);

        this.savePersistence();
        this.showToast('Turnamen Dikonfigurasi & Simulasi Dimulai!');
      }
    });
  }

  forceReset() {
    Swal.fire({
      title: 'Reset & Simulasi Full?',
      text: 'Semua data lama akan dihapus dan diganti dengan 8 Tim + Skor Quarter Final otomatis!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset Sekarang!',
      confirmButtonColor: '#ef4444',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear(); // Hapus semua memory lama
        location.reload();    // Refresh halaman untuk memuat data baru dari code
      }
    });
  }

  resetBracket() {
    if (!this.isAdminMode) return;
    
    Swal.fire({
      title: 'Reset Total Bracket?',
      text: 'Semua tim dan skor akan dihapus. Bagan akan menjadi kosong (TBD)!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset Total!',
      confirmButtonColor: '#ef4444',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. Reset Matches Schedule
        this.matches = [];
        
        // 2. Reset Quarter Finals to TBD (Total Wipeout)
        this.bracket.quarterFinals = [
          { id: 'QF1', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false },
          { id: 'QF2', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false },
          { id: 'QF3', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false },
          { id: 'QF4', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false }
        ];
        
        // 3. Reset SF, Final, 3rd Place to TBD
        this.bracket.semiFinals = [
          { id: 'SF1', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false },
          { id: 'SF2', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false }
        ];
        this.bracket.final = { id: 'F1', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false };
        this.bracket.thirdPlace = { id: 'TP', home: 'TBD', away: 'TBD', homeScore: null, awayScore: null, done: false };
        
        this.savePersistence();
        this.showToast('Bagan telah dikosongkan total!');
      }
    });
  }

  openTournamentSettings() {
    if (!this.isAdminMode) return;

    const sportOptions = Object.entries(this.sportPresets).map(([key, val]) => 
      `<option value="${key}" ${this.tournamentConfig.sportType === key ? 'selected' : ''}>${val.label}</option>`
    ).join('');

    const cfg = this.tournamentConfig;
    
    Swal.fire({
      title: 'Pengaturan Turnamen',
      html: `
        <div class="swal-luxury-form">
          <div class="form-group" style="margin-bottom: 15px; text-align: left;">
            <label style="font-size:0.8rem; color:var(--text-muted);">Nama Turnamen</label>
            <input id="cfgName" type="text" style="width:100%; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff;" value="${cfg.name}">
          </div>
          <div class="form-group" style="margin-bottom: 15px; text-align: left;">
            <label style="font-size:0.8rem; color:var(--text-muted);">Deskripsi Turnamen</label>
            <input id="cfgSub" type="text" style="width:100%; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff;" value="${cfg.subtitle}">
          </div>
          <div class="form-group" style="margin-bottom: 15px; text-align: left;">
            <label style="font-size:0.8rem; color:var(--text-muted);">🏅 Jenis Olahraga</label>
            <select id="cfgSport" style="width:100%; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff; font-size:0.9rem;">
              ${sportOptions}
            </select>
          </div>
          <div id="sportDetailBox" style="background:rgba(255,255,255,0.05); border:1px dashed rgba(255,255,255,0.15); border-radius:10px; padding:12px; margin-bottom:10px;">
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; font-weight:700;">⚙️ Detail Format Pertandingan</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <div style="flex:1; min-width:100px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Label Periode</label>
                <input id="cfgPeriodLabel" type="text" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.periodLabel}">
              </div>
              <div style="flex:1; min-width:60px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Jumlah</label>
                <input id="cfgPeriods" type="number" min="1" max="9" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.periods}">
              </div>
              <div style="flex:1; min-width:60px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Durasi (menit)</label>
                <input id="cfgDuration" type="number" min="0" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.periodDuration}">
              </div>
            </div>
            <div style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap;">
              <div style="flex:1; min-width:80px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Jeda (menit)</label>
                <input id="cfgBreak" type="number" min="0" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.breakDuration}">
              </div>
              <div style="flex:1; min-width:80px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Label Jeda</label>
                <input id="cfgBreakLabel" type="text" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.breakLabel}">
              </div>
              <div style="flex:1; min-width:80px; text-align:left;">
                <label style="font-size:0.7rem; color:var(--text-muted);">Label Skor</label>
                <input id="cfgScoreLabel" type="text" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:#fff; font-size:0.85rem;" value="${cfg.scoreLabel}">
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      didOpen: () => {
        const sportSelect = document.getElementById('cfgSport') as HTMLSelectElement;
        sportSelect.addEventListener('change', () => {
          const key = sportSelect.value;
          const preset = this.sportPresets[key] || this.sportPresets['custom'];
          (document.getElementById('cfgPeriodLabel') as HTMLInputElement).value = preset.periodLabel;
          (document.getElementById('cfgPeriods') as HTMLInputElement).value = preset.periods.toString();
          (document.getElementById('cfgDuration') as HTMLInputElement).value = preset.periodDuration.toString();
          (document.getElementById('cfgBreak') as HTMLInputElement).value = preset.breakDuration.toString();
          (document.getElementById('cfgBreakLabel') as HTMLInputElement).value = preset.breakLabel;
          (document.getElementById('cfgScoreLabel') as HTMLInputElement).value = preset.scoreLabel;
        });
      },
      preConfirm: () => {
        return {
          name: (document.getElementById('cfgName') as HTMLInputElement).value,
          subtitle: (document.getElementById('cfgSub') as HTMLInputElement).value,
          sportType: (document.getElementById('cfgSport') as HTMLSelectElement).value,
          periodLabel: (document.getElementById('cfgPeriodLabel') as HTMLInputElement).value,
          periods: parseInt((document.getElementById('cfgPeriods') as HTMLInputElement).value) || 2,
          periodDuration: parseInt((document.getElementById('cfgDuration') as HTMLInputElement).value) || 0,
          breakDuration: parseInt((document.getElementById('cfgBreak') as HTMLInputElement).value) || 0,
          breakLabel: (document.getElementById('cfgBreakLabel') as HTMLInputElement).value,
          scoreLabel: (document.getElementById('cfgScoreLabel') as HTMLInputElement).value,
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const v = result.value;
        this.tournamentConfig.name = v.name;
        this.tournamentConfig.subtitle = v.subtitle;
        this.tournamentConfig.sportType = v.sportType;
        this.tournamentConfig.periodLabel = v.periodLabel;
        this.tournamentConfig.periods = v.periods;
        this.tournamentConfig.periodDuration = v.periodDuration;
        this.tournamentConfig.breakDuration = v.breakDuration;
        this.tournamentConfig.breakLabel = v.breakLabel;
        this.tournamentConfig.scoreLabel = v.scoreLabel;
        const preset = this.sportPresets[v.sportType];
        if (preset) {
          this.tournamentConfig.sportIcon = preset.icon;
          this.tournamentConfig.playerLabel = preset.playerLabel;
        }
        this.savePersistence();
        this.showToast('Pengaturan Turnamen diperbarui!');
      }
    });
  }

  editBracketMatch(match: any, category: string, index?: number) {
    if (!this.isAdminMode) return;
    
    Swal.fire({
      title: 'Kalah/Menang - Bracket',
      html: `
        <div class="swal-luxury-form">
          <div class="swal-score-card">
            <div class="team-slot">
              <div class="team-initial">${match.home.charAt(0)}</div>
              <div class="team-label">${match.home}</div>
              <input id="bHomeScore" type="number" value="${match.homeScore || 0}" class="score-input">
            </div>
            <div class="vs-column">VS</div>
            <div class="team-slot">
              <div class="team-initial">${match.away.charAt(0)}</div>
              <div class="team-label">${match.away}</div>
              <input id="bAwayScore" type="number" value="${match.awayScore || 0}" class="score-input">
            </div>
          </div>
          <div class="status-selector-box">
            <label class="status-title">STATUS</label>
            <div class="status-pills">
              <div class="status-pill ${match.done ? '' : 'active'}" data-value="false">Upcoming</div>
              <div class="status-pill ${match.done ? 'active' : ''}" data-value="true">Finished</div>
            </div>
            <input type="hidden" id="matchDone" value="${match.done}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      didOpen: () => {
        document.querySelectorAll('.status-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            (document.getElementById('matchDone') as HTMLInputElement).value = (pill as HTMLElement).dataset['value']!;
          });
        });
      },
      preConfirm: () => {
        return {
          homeScore: (document.getElementById('bHomeScore') as HTMLInputElement).value,
          awayScore: (document.getElementById('bAwayScore') as HTMLInputElement).value,
          done: (document.getElementById('matchDone') as HTMLInputElement).value === 'true'
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        match.homeScore = parseInt(result.value.homeScore) || 0;
        match.awayScore = parseInt(result.value.awayScore) || 0;
        match.done = result.value.done;
        
        // AUTO ADVANCE LOGIC
        this.checkBracketProgression();
        
        this.savePersistence();
        this.showToast('Bracket diperbarui!');
      }
    });
  }

  checkBracketProgression() {
    const q = this.bracket.quarterFinals;
    const s = this.bracket.semiFinals;
    const f = this.bracket.final;
    const t = this.bracket.thirdPlace;

    // Helper to get winner
    const getWinner = (m: any) => m.done ? (m.homeScore > m.awayScore ? m.home : m.away) : 'TBD';
    const getLoser = (m: any) => m.done ? (m.homeScore > m.awayScore ? m.away : m.home) : 'TBD';

    // QF -> SF
    s[0].home = getWinner(q[0]);
    s[0].away = getWinner(q[1]);
    s[1].home = getWinner(q[2]);
    s[1].away = getWinner(q[3]);

    // SF -> FINAL & 3RD PLACE
    f.home = getWinner(s[0]);
    f.away = getWinner(s[1]);
    
    t.home = getLoser(s[0]);
    t.away = getLoser(s[1]);
  }


  // Data Collections
  teams: Team[] = [
    {
      id: 'T-001', name: 'FC Barcelona', captain: 'Lionel', contact: '08123456789',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p1', name: 'Lionel', number: 10 }, { id: 'p2', name: 'Pedri', number: 8 }]
    },
    {
      id: 'T-002', name: 'Real Madrid', captain: 'Karim', contact: '08198765432',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p3', name: 'Karim', number: 9 }, { id: 'p4', name: 'Vini', number: 20 }]
    },
    {
      id: 'T-003', name: 'Bhinneka FC', captain: 'Agus', contact: '0857223344',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p5', name: 'Agus', number: 7 }]
    },
    {
      id: 'T-004', name: 'Garuda Muda', captain: 'Budi', contact: '0812998877',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p6', name: 'Budi', number: 1 }]
    },
    {
      id: 'T-005', name: 'Elang Jaya', captain: 'Candra', contact: '0877112233',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p7', name: 'Candra', number: 99 }]
    },
    {
      id: 'T-006', name: 'Satria Muda', captain: 'Dedi', contact: '0821665544',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p8', name: 'Dedi', number: 5 }]
    },
    {
      id: 'T-007', name: 'Rajawali FC', captain: 'Eko', contact: '0899334455',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p9', name: 'Eko', number: 11 }]
    },
    {
      id: 'T-008', name: 'Merpati', captain: 'Fajar', contact: '0852778899',
      status: 'Verified', registeredDate: new Date().toISOString(),
      players: [{ id: 'p10', name: 'Fajar', number: 23 }]
    }
  ];

  matches: Match[] = [
    {
      id: 'M-QF1', homeTeam: 'FC Barcelona', awayTeam: 'Real Madrid',
      date: new Date().toISOString().split('T')[0], time: '08:00', location: 'Lapangan Utama (QF)', status: 'Finished', 
      homeHalf1: 2, awayHalf1: 0, homeHalf2: 1, awayHalf2: 1, homeScore: 3, awayScore: 1
    },
    {
      id: 'M-QF2', homeTeam: 'Bhinneka FC', awayTeam: 'Garuda Muda',
      date: new Date().toISOString().split('T')[0], time: '09:25', location: 'Lapangan Utama (QF)', status: 'Finished',
      homeHalf1: 1, awayHalf1: 2, homeHalf2: 1, awayHalf2: 2, homeScore: 2, awayScore: 4
    },
    {
      id: 'M-QF3', homeTeam: 'Elang Jaya', awayTeam: 'Satria Muda',
      date: new Date().toISOString().split('T')[0], time: '10:50', location: 'Lapangan Utama (QF)', status: 'Finished',
      homeHalf1: 3, awayHalf1: 1, homeHalf2: 2, awayHalf2: 1, homeScore: 5, awayScore: 2
    },
    {
      id: 'M-QF4', homeTeam: 'Rajawali FC', awayTeam: 'Merpati',
      date: new Date().toISOString().split('T')[0], time: '12:15', location: 'Lapangan Utama (QF)', status: 'Finished',
      homeHalf1: 0, awayHalf1: 2, homeHalf2: 0, awayHalf2: 1, homeScore: 0, awayScore: 3
    }
  ];

  // Schedule filter
  selectedMatchday: string = 'all';

  notifications: AppNotification[] = [
    { id: 'N1', title: 'Schedule Update', message: 'Pertandingan M-101 diundur ke pukul 20:00 WIB.', date: new Date().toISOString(), type: 'info' },
    { id: 'N2', title: 'Registration Close', message: 'Pendaftaran ditutup dalam 3 hari lagi!', date: new Date().toISOString(), type: 'alert' }
  ];

  // Dynamic Form State for Team Registration
  registrationForm: { name: string; captain: string; contact: string; players: Player[] } = {
    name: '', captain: '', contact: '', players: []
  };

  // UI Modals & Popups
  isTeamDetailOpen = false;
  selectedTeam: Team | null = null;
  
  constructor() {}

  ngOnInit() {
    this.addPlayerField();
    this.loadPersistence(); // Load all data from LocalStorage
    this.checkBracketProgression(); // Calculate advancements for initial data
    this.startLiveScoringEngine(); // Activate real-time score updates
    
    setTimeout(() => {
      this.showSplash = false;
      setTimeout(() => this.isLoading = false, 1000);
    }, 2000);
  }

  // ===== NEW SEQUENTIAL TOURNAMENT SIMULATOR ===== //
  isSimulating = false;

  startLiveScoringEngine() {
    // Engine dihapus - diganti manual trigger dari halaman Matches
  }

  simulateAllScores() {
    if (!this.isAdminMode) return;

    Swal.fire({
      title: '⚡ Auto-Simulasi Skor',
      html: `
        <div class="swal-luxury-form">
          <div class="sim-footer-note" style="margin-bottom:0;">
            <ion-icon name="information-circle-outline"></ion-icon>
            Semua pertandingan yang belum selesai akan disimulasikan skornya secara otomatis (${this.getMatchDurationLabel()}).
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🚀 Simulasikan Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        let count = 0;

        const simulateMatch = (m: any) => {
          if (!m.done && m.home !== 'TBD' && m.away !== 'TBD') {
            m.homeHalf1 = Math.floor(Math.random() * 4);
            m.awayHalf1 = Math.floor(Math.random() * 4);
            m.homeHalf2 = Math.floor(Math.random() * 4);
            m.awayHalf2 = Math.floor(Math.random() * 4);
            m.homeScore = m.homeHalf1 + m.homeHalf2;
            m.awayScore = m.awayHalf1 + m.awayHalf2;
            if (m.homeScore === m.awayScore) {
              if (Math.random() > 0.5) { m.homeHalf2++; m.homeScore++; }
              else { m.awayHalf2++; m.awayScore++; }
            }
            m.done = true;
            count++;
          }
        };

        // Simulasi semua round secara berurutan
        this.bracket.quarterFinals.forEach((m: any) => simulateMatch(m));
        this.checkBracketProgression();

        this.bracket.semiFinals.forEach((m: any) => simulateMatch(m));
        this.checkBracketProgression();

        simulateMatch(this.bracket.thirdPlace);
        simulateMatch(this.bracket.final);

        this.checkBracketProgression();
        this.savePersistence();
        this.showToast(`✅ ${count} pertandingan berhasil disimulasikan!`);
      }
    });
  }

  syncMatchToBracket(match: Match) {
    // Tetap dipertahankan untuk update manual dari tab Jadwal
    const updateInRound = (roundArray: any[]) => {
      const bMatch = roundArray.find(m => m.id === match.id);
      if (bMatch) {
         bMatch.homeScore = match.homeScore;
         bMatch.awayScore = match.awayScore;
         bMatch.done = true;
      }
    };
    updateInRound(this.bracket.quarterFinals);
    updateInRound(this.bracket.semiFinals);
    if (this.bracket.final.id === match.id) {
       this.bracket.final.homeScore = match.homeScore;
       this.bracket.final.awayScore = match.awayScore;
       this.bracket.final.done = true;
    }
    if (this.bracket.thirdPlace.id === match.id) {
       this.bracket.thirdPlace.homeScore = match.homeScore;
       this.bracket.thirdPlace.awayScore = match.awayScore;
       this.bracket.thirdPlace.done = true;
    }
  }

  // ===== DATA PERSISTENCE (LOCAL STORAGE) ===== //
  loadPersistence() {
    // 1. Load Session
    const userSession = localStorage.getItem('tourneyUser');
    if (userSession) {
      this.isUserLoggedIn = true;
      this.currentUserName = userSession === 'active' ? 'Kapten Tim' : userSession;
    }
    const userEmail = localStorage.getItem('tourneyUserEmail');
    if (userEmail) {
      this.authUsername = userEmail;
    }
    if (localStorage.getItem('tourneyAdmin') === 'active') this.isAdminMode = true;

    // 2. Load Teams
    const savedTeams = localStorage.getItem('tourney_teams');
    if (savedTeams) {
      this.teams = JSON.parse(savedTeams);
    }

    // 3. Load Matches
    const savedMatches = localStorage.getItem('tourney_matches');
    if (savedMatches) {
      this.matches = JSON.parse(savedMatches);
    }

    // 4. Load Bracket
    const savedBracket = localStorage.getItem('tourney_bracket');
    if (savedBracket) {
      this.bracket = JSON.parse(savedBracket);
    }

    // 5. Load Chat
    const savedChats = localStorage.getItem('tourney_chats');
    if (savedChats) {
      this.chatMessages = JSON.parse(savedChats);
    }

    // 6. Load Notifications
    const savedNotifs = localStorage.getItem('tourney_notifs');
    if (savedNotifs) {
      this.notifications = JSON.parse(savedNotifs);
    }

    // 6.5 Load Config
    const savedConfig = localStorage.getItem('tourney_config');
    if (savedConfig) {
      this.tournamentConfig = JSON.parse(savedConfig);
    }

    // 7. Load ViewMode (restore last page)
    const savedView = localStorage.getItem('tourney_viewMode');
    if (savedView && (this.isUserLoggedIn || this.isAdminMode)) {
      this.viewMode = savedView as any;
    } else if (this.isUserLoggedIn) {
      this.viewMode = 'profile';
    }

    // 8. Load Dark Mode
    if (localStorage.getItem('tourney_theme') === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }
  }

  savePersistence() {
    localStorage.setItem('tourney_teams', JSON.stringify(this.teams));
    localStorage.setItem('tourney_matches', JSON.stringify(this.matches));
    localStorage.setItem('tourney_bracket', JSON.stringify(this.bracket));
    localStorage.setItem('tourney_chats', JSON.stringify(this.chatMessages));
    localStorage.setItem('tourney_notifs', JSON.stringify(this.notifications));
    localStorage.setItem('tourney_config', JSON.stringify(this.tournamentConfig));
  }

  logoutUser() {
    this.isUserLoggedIn = false;
    this.currentUserName = '';
    this.authUsername = '';
    localStorage.removeItem('tourneyUser');
    localStorage.removeItem('tourneyUserEmail');
    localStorage.removeItem('tourney_viewMode');
    this.showToast('Anda telah Logout.');
    this.viewMode = 'matches';
  }

  // ===== NAVIGATION & THEMING ===== //
  switchView(mode: 'matches' | 'teams' | 'register' | 'profile') {
    if (mode === 'register' && !this.isUserLoggedIn && !this.isAdminMode) {
      this.isAuthModalOpen = true;
      this.showToast('Login Kapten diperlukan');
      return;
    }
    if (mode === 'profile' && !this.isUserLoggedIn) {
      this.isAuthModalOpen = true;
      this.showToast('Login diperlukan untuk melihat profil.');
      return;
    }
    this.viewMode = mode;
    localStorage.setItem('tourney_viewMode', mode);
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
    localStorage.setItem('tourney_theme', this.isDarkMode ? 'dark' : 'light');
  }

  // ===== ADMIN AUTH LOGIC ===== //
  toggleAdminMode() {
    if (this.isAdminMode) {
      this.isAdminMode = false;
      localStorage.removeItem('tourneyAdmin'); // Clear session
      this.showToast('Admin Mode Disabled');
      return;
    }
    this.adminPIN = '';
    this.isAdminAuthOpen = true;
  }

  checkAdminPIN() {
    if (this.adminPIN === 'admin123') {
      this.isAdminMode = true;
      localStorage.setItem('tourneyAdmin', 'active'); // Save session
      this.isAdminAuthOpen = false;
      this.showToast('Access Granted. Welcome Admin!');
    } else {
      this.showToast('Access Denied. Incorrect PIN.');
    }
  }

  // ===== USER AUTHENTICATION LOGIC ===== //
  simulateUserLogin() {
    if (!this.authUsername) {
      this.showToast('Harap isi Email atau Username!');
      return;
    }
    this.currentUserName = this.authUsername.split('@')[0]; // Ambil nama depan dari email
    this.isUserLoggedIn = true;
    localStorage.setItem('tourneyUser', this.currentUserName); // Save session
    localStorage.setItem('tourneyUserEmail', this.authUsername); // Save email
    this.isAuthModalOpen = false;
    this.showToast(`Selamat datang, ${this.currentUserName}!`);
    this.switchView('profile');
  }

  simulateForgotPassword() {
    if (!this.forgotUsername || !this.forgotPassword || !this.forgotConfirm) {
      this.showToast('Harap lengkapi semua kolom!');
      return;
    }
    if (this.forgotPassword !== this.forgotConfirm) {
      this.showToast('Konfirmasi kata sandi tidak cocok!');
      return;
    }
    this.showToast('Kata sandi berhasil diatur ulang! Silakan login.');
    this.userAuthMode = 'login';
    this.forgotUsername = '';
    this.forgotPassword = '';
    this.forgotConfirm = '';
  }

  openProfileResetPassword() {
    Swal.fire({
      title: 'Ganti Kata Sandi',
      html: `
        <div class="swal-luxury-form">
          <input type="password" id="newPwd" class="score-input" placeholder="Kata Sandi Baru" style="width:100%; padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2); color:#fff; margin-bottom:15px; outline:none;" autocomplete="new-password">
          <input type="password" id="confirmPwd" class="score-input" placeholder="Konfirmasi Kata Sandi" style="width:100%; padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2); color:#fff; outline:none;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Sandi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      preConfirm: () => {
        const p1 = (document.getElementById('newPwd') as HTMLInputElement).value;
        const p2 = (document.getElementById('confirmPwd') as HTMLInputElement).value;
        if (!p1 || !p2) {
          Swal.showValidationMessage('Harap isi kedua kolom sandi.');
          return false;
        }
        if (p1 !== p2) {
          Swal.showValidationMessage('Kata sandi Anda tidak cocok!');
          return false;
        }
        return true;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.showToast('Kata sandi berhasil diperbarui.');
      }
    });
  }

  // ===== TEAM REGISTRATION LOGIC ===== //
  addPlayerField() {
    this.registrationForm.players.push({
      id: 'p-' + Math.random().toString(36).substr(2, 6),
      name: '',
      number: null
    });
  }

  removePlayerField(index: number) {
    if (this.registrationForm.players.length > 1) {
      this.registrationForm.players.splice(index, 1);
    }
  }

  submitRegistration() {
    // Basic validation
    if (!this.registrationForm.name || !this.registrationForm.captain || !this.registrationForm.contact) {
      this.showToast('Harap lengkapi info dasar tim Anda.');
      return;
    }

    // Filter out empty players
    const validPlayers = this.registrationForm.players.filter(p => p.name && p.number !== null && p.number !== '');
    if (validPlayers.length < 1) {
      this.showToast('Minimal cantumkan 1 pemain aktif.');
      return;
    }

    const newTeam: Team = {
      id: 'T-' + Math.floor(1000 + Math.random() * 9000).toString(),
      name: this.registrationForm.name,
      captain: this.registrationForm.captain,
      contact: this.registrationForm.contact,
      players: validPlayers,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
      ownerUser: this.currentUserName
    };

    this.teams.unshift(newTeam); // Add to beginning
    this.savePersistence();
    
    // Reset form
    this.registrationForm = { name: '', captain: '', contact: '', players: [] };
    this.addPlayerField();
    
    this.showToast('Pendaftaran Berhasil!');
    this.switchView('profile');
  }

  getUserTeam() {
    return this.teams.find(t => t.ownerUser === this.currentUserName);
  }

  // ===== ADMIN MANAGEMENT ===== //
  verifyTeam(team: Team, event: Event) {
    event.stopPropagation();
    if (!this.isAdminMode) return;
    team.status = 'Verified';
    this.savePersistence();
    this.showToast(`Tim ${team.name} diverifikasi.`);
  }

  deleteMatch(match: Match) {
    if (!this.isAdminMode) return;
    Swal.fire({
      title: 'Hapus Jadwal?',
      text: `Hapus pertandingan ${match.homeTeam} vs ${match.awayTeam}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.matches = this.matches.filter(m => m.id !== match.id);
        this.savePersistence();
        this.showToast('Jadwal berhasil dihapus.');
      }
    });
  }

  addMatch() {
    if (!this.isAdminMode) return;

    // Build team options from registered teams
    const teamOptions = this.teams.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

    Swal.fire({
      title: 'Tambah Jadwal Baru',
      html: `
        <div class="swal-luxury-form">
          <div class="status-selector-box" style="margin-bottom:14px">
            <label class="status-title">TIM TUAN RUMAH</label>
            <select id="addHomeTeam" class="swal-select-input">
              <option value="">-- Pilih Tim --</option>
              ${teamOptions}
            </select>
          </div>
          <div class="status-selector-box" style="margin-bottom:14px">
            <label class="status-title">TIM TAMU</label>
            <select id="addAwayTeam" class="swal-select-input">
              <option value="">-- Pilih Tim --</option>
              ${teamOptions}
            </select>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:14px;">
            <div class="status-selector-box" style="flex:1">
              <label class="status-title">TANGGAL</label>
              <input id="addDate" type="date" class="swal-text-input">
            </div>
            <div class="status-selector-box" style="flex:1">
              <label class="status-title">WAKTU</label>
              <input id="addTime" type="time" class="swal-text-input">
            </div>
          </div>
          <div class="status-selector-box">
            <label class="status-title">LOKASI</label>
            <input id="addLocation" type="text" placeholder="Nama GOR / Lapangan" class="swal-text-input">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Buat Jadwal',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      preConfirm: () => {
        const homeTeam = (document.getElementById('addHomeTeam') as HTMLSelectElement).value;
        const awayTeam = (document.getElementById('addAwayTeam') as HTMLSelectElement).value;
        const date = (document.getElementById('addDate') as HTMLInputElement).value;
        const time = (document.getElementById('addTime') as HTMLInputElement).value;
        const location = (document.getElementById('addLocation') as HTMLInputElement).value;

        if (!homeTeam || !awayTeam || !date || !time || !location) {
          Swal.showValidationMessage('Semua field harus diisi!');
          return false;
        }
        if (homeTeam === awayTeam) {
          Swal.showValidationMessage('Tim tuan rumah dan tamu tidak boleh sama!');
          return false;
        }
        return { homeTeam, awayTeam, date, time, location };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newMatch: Match = {
          id: 'M-' + Math.floor(100 + Math.random() * 900).toString(),
          homeTeam: result.value.homeTeam,
          awayTeam: result.value.awayTeam,
          date: result.value.date,
          time: result.value.time,
          location: result.value.location,
          status: 'Upcoming'
        };
        this.matches.unshift(newMatch);
        this.savePersistence();
        this.showToast('Jadwal pertandingan baru berhasil ditambahkan!');
      }
    });
  }

  editMatch(match: Match) {
    if (!this.isAdminMode) return;
    
    Swal.fire({
      title: 'Update Skor Pertandingan',
      html: `
        <div class="swal-luxury-form">
          <div class="swal-score-card">
            <div class="team-slot">
              <div class="team-initial">${match.homeTeam.charAt(0)}</div>
              <div class="team-label">${match.homeTeam}</div>
              <input id="homeScore" type="number" value="${match.homeScore || 0}" class="score-input">
            </div>
            
            <div class="vs-column">VS</div>
            
            <div class="team-slot">
              <div class="team-initial">${match.awayTeam.charAt(0)}</div>
              <div class="team-label">${match.awayTeam}</div>
              <input id="awayScore" type="number" value="${match.awayScore || 0}" class="score-input">
            </div>
          </div>
          
          <div class="status-selector-box">
            <label class="status-title">STATUS PERTANDINGAN</label>
            <div class="status-pills">
              <div class="status-pill ${match.status === 'Upcoming' ? 'active' : ''}" data-value="Upcoming">
                <span class="pill-dot upcoming"></span>
                Upcoming
              </div>
              <div class="status-pill ${match.status === 'Live' ? 'active' : ''}" data-value="Live">
                <span class="pill-dot live"></span>
                Live
              </div>
              <div class="status-pill ${match.status === 'Finished' ? 'active' : ''}" data-value="Finished">
                <span class="pill-dot finished"></span>
                Finished
              </div>
            </div>
            <input type="hidden" id="matchStatus" value="${match.status}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Skor',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      heightAuto: false,
      customClass: {
        popup: 'luxury-swal-popup',
        confirmButton: 'luxury-confirm-btn',
        cancelButton: 'luxury-cancel-btn'
      },
      didOpen: () => {
        document.querySelectorAll('.status-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            (document.getElementById('matchStatus') as HTMLInputElement).value = (pill as HTMLElement).dataset['value']!;
          });
        });
      },
      preConfirm: () => {
        return {
          homeScore: (document.getElementById('homeScore') as HTMLInputElement).value,
          awayScore: (document.getElementById('awayScore') as HTMLInputElement).value,
          status: (document.getElementById('matchStatus') as HTMLInputElement).value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        match.homeScore = parseInt(result.value.homeScore) || 0;
        match.awayScore = parseInt(result.value.awayScore) || 0;
        match.status = result.value.status as any;
        this.savePersistence();
        this.showToast('Skor pertandingan berhasil diperbarui!');
      }
    });
  }

  deleteTeam(team: Team) {
    if (!this.isAdminMode) return;
    
    Swal.fire({
      title: 'Hapus Tim?',
      text: `Cabut pendaftaran tim ${team.name} secara permanen?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.teams = this.teams.filter(t => t.id !== team.id);
        this.isTeamDetailOpen = false;
        this.savePersistence();
        this.showToast('Tim berhasil dihapus.');
      }
    });
  }

  // ===== UI HELPERS ===== //
  openTeamDetail(team: Team) {
    this.selectedTeam = team;
    this.isTeamDetailOpen = true;
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ===== SCHEDULE HELPERS ===== //
  // Combines manual matches + bracket matches
  getAllMatches(): Match[] {
    const knockoutMatches: Match[] = [];
    
    // Helper to convert bracket match to Match interface
    const mapBracket = (m: any, label: string) => {
      if (!m.home || m.home === 'TBD') return;
      knockoutMatches.push({
        id: m.id,
        homeTeam: m.home,
        awayTeam: m.away,
        homeScore: m.homeScore ?? undefined,
        awayScore: m.awayScore ?? undefined,
        date: m.date || new Date().toISOString().split('T')[0],
        time: m.time || 'Knockout',
        location: label,
        status: m.done ? 'Finished' : 'Upcoming'
      });
    };

    // Quarter Finals
    this.bracket.quarterFinals.forEach((m: any) => mapBracket(m, 'Quarter Final'));
    // Semi Finals
    this.bracket.semiFinals.forEach((m: any) => mapBracket(m, 'Semi Final'));
    // Final
    mapBracket(this.bracket.final, 'FINAL');
    // 3rd Place
    mapBracket(this.bracket.thirdPlace, '3rd Place');

    return [...this.matches, ...knockoutMatches];
  }

  getMatchDays(): string[] {
    const all = this.getAllMatches();
    const dates = all.map(m => m.date);
    return [...new Set(dates)].sort();
  }

  getFilteredMatches(): Match[] {
    const all = this.getAllMatches();
    if (this.selectedMatchday === 'all') return all;
    return all.filter(m => m.date === this.selectedMatchday);
  }

  formatDayShort(dateStr: string): { day: string; weekday: string; month: string } {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      weekday: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      month: d.toLocaleDateString('id-ID', { month: 'short' })
    };
  }

  getMatchCount(date: string): number {
    const all = this.getAllMatches();
    return all.filter(m => m.date === date).length;
  }

  showToast(message: string) {
    Swal.fire({
      title: message,
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      heightAuto: false
    });
  }

  // ===== IN-APP CHAT LOGIC ===== //
  openChat() {
    if (!this.isUserLoggedIn && !this.isAdminMode) {
      this.showToast('Silakan Login Kapten atau Admin untuk membuka obrolan.');
      return;
    }
    this.isChatModalOpen = true;
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 100);
  }

  sendMessage() {
    if (!this.chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: 'C-' + Math.floor(Math.random() * 10000),
      sender: this.isAdminMode ? 'Admin Panitia' : (this.currentUserName || 'Kapten Tim'),
      role: this.isAdminMode ? 'Admin' : 'User',
      message: this.chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    this.chatMessages.push(newMessage);
    this.savePersistence();
    this.chatInput = '';
    
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 50);
  }

  scrollChatToBottom() {
    const chatContainer = document.querySelector('.chat-scroll-area');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  // ===== EXPORT PDF ===== //
  exportMatchesPDF() {
    try {
      const allMatches = this.getAllMatches();

      const groupedMatches: any = {
        'Quarter Final': allMatches.filter((m: any) => m.id && m.id.startsWith('QF')),
        'Semi Final': allMatches.filter((m: any) => m.id && m.id.startsWith('SF')),
        'Perebutan Juara 3': allMatches.filter((m: any) => m.id === 'TP'),
        'Final': allMatches.filter((m: any) => m.id === 'F1' || m.id === 'Final')
      };

    let tableHTML = '';
    for (const [stage, matches] of Object.entries(groupedMatches) as [string, any][]) {
      if (matches.length === 0) continue;
      
      const firstLocation = matches[0].location;
      
      let rows = matches.map((m: any, i: number) => {
        let scoreStr = m.status === 'Finished' ? `${m.homeScore} - ${m.awayScore}` : 'VS';
        return `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td style="text-align:center;">${m.time} WIB</td>
            <td style="text-align:left; font-weight:600;">${m.homeTeam}</td>
            <td style="text-align:center; font-weight:bold; background:#f9fafb;">${scoreStr}</td>
            <td style="text-align:right; font-weight:600;">${m.awayTeam}</td>
            <td style="text-align:center;">${m.location}</td>
          </tr>
        `;
      }).join('');

      tableHTML += `
        <h4 style="margin-top: 20px; font-size: 0.95rem; color:#064e3b; border-left: 3px solid #10b981; padding-left: 10px; margin-bottom: 8px;">Babak: ${stage}</h4>
        <p style="font-size: 0.85rem; margin-bottom: 12px; color: #333; text-align: justify;">
          Pertandingan untuk babak <strong>${stage}</strong> dijadwalkan bertempat di <strong>${firstLocation}</strong>. Seluruh tim yang bertanding diharapkan memperhatikan waktu <em>kick-off</em> dan mempersiapkan diri di lokasi. Berikut rincian jadwal pertandingannya:
        </p>
        <table class="formal-table">
          <thead>
            <tr>
              <th style="width:30px; text-align:center;">No</th>
              <th style="width:100px; text-align:center;">Waktu</th>
              <th style="text-align:left;">Tim Tuan Rumah</th>
              <th style="width:80px; text-align:center;">Skor</th>
              <th style="text-align:right;">Tim Tamu</th>
              <th style="text-align:center;">Tempat</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    const html = `
      <div class="surat-container" style="position: relative; min-height: 800px;">
        <!-- WATERMARK -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; z-index: 0; pointer-events: none; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <ion-icon name="${this.tournamentConfig.sportIcon}" style="font-size: 450px; color: #000;"></ion-icon>
        </div>
        <!-- KOP SURAT TERPUSAT -->
        <div style="border-bottom: 4px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; position: relative;">
          <!-- Garis ganda di bawah KOP -->
          <div style="position: absolute; bottom: -8px; left: 0; right: 0; border-bottom: 1px solid #1a1a1a; height: 1px;"></div>
          
          <ion-icon name="trophy-outline" style="font-size: 4rem; color: #064e3b;"></ion-icon>
          <div style="flex: 1; text-align: center;">
            <h1 style="margin: 0; font-size: 1.6rem; color: #1a1a1a; font-weight:900; text-transform:uppercase; letter-spacing: 1px;">Panitia Pelaksana ${this.tournamentConfig.name}</h1>
            <p style="margin: 4px 0 0; font-size: 0.9rem; color: #1a1a1a; font-weight: bold;">Cabang Olahraga: ${this.sportPresets[this.tournamentConfig.sportType]?.label || 'Umum'}</p>
            <p style="margin: 2px 0 0; font-size: 0.8rem; color: #444;">Dokumen Resmi Pertandingan — ${this.tournamentConfig.subtitle}</p>
          </div>
          <ion-icon name="trophy-outline" style="font-size: 4rem; color: transparent;"></ion-icon>
        </div>

        <!-- ATRIBUT SURAT -->
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 25px; color: #1a1a1a;">
          <div>
            <table style="border:none; line-height: 1.5; font-size: 0.9rem; margin:0; padding:0;">
              <tr><td style="padding:0 15px 0 0; border:none; vertical-align: top;">Nomor</td><td style="padding:0; border:none; vertical-align: top;">: 014/LM-MATCH/2026</td></tr>
              <tr><td style="padding:0 15px 0 0; border:none; vertical-align: top;">Lampiran</td><td style="padding:0; border:none; vertical-align: top;">: 1 (Satu) Berkas</td></tr>
              <tr><td style="padding:0 15px 0 0; border:none; vertical-align: top;">Perihal</td><td style="padding:0; border:none; font-weight:bold; vertical-align: top;">: Ketetapan Jadwal & Hasil Pertandingan</td></tr>
            </table>
          </div>
          <div style="text-align:right;">
            Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <!-- ISI SURAT -->
        <div style="font-size: 0.9rem; line-height: 1.5; color: #1a1a1a; text-align: justify;">
          <p style="margin-bottom: 8px;"><strong>Kepada Yth.</strong><br>Seluruh Manajer, Pelatih, dan Kapten Tim di Tempat</p>
          <p style="margin-bottom: 8px;">Dengan hormat,</p>
          <p style="margin-bottom: 10px;">
            Bersama surat ini, Panitia Penyelenggara <strong>${this.tournamentConfig.name}</strong> merilis secara resmi jadwal dan hasil pertandingan cabang olahraga <strong>${this.sportPresets[this.tournamentConfig.sportType]?.label || 'Umum'}</strong>. Pertandingan diawasi oleh wasit bersertifikasi dengan format <strong>${this.getMatchDurationLabel()}</strong>${this.tournamentConfig.breakDuration > 0 ? ` (jeda ${this.tournamentConfig.breakDuration} menit)` : ''}.
          </p>
          
          <div style="margin-top: 15px; margin-bottom: 10px;">
            ${tableHTML}
          </div>

          <p style="margin-top: 10px; font-weight: bold; margin-bottom: 5px;">Ketentuan Pertandingan:</p>
          <ol style="padding-left: 20px; margin-top: 0; margin-bottom: 10px; line-height: 1.4;">
            <li style="margin-bottom: 2px;">Tim <strong>wajib hadir 30 menit</strong> sebelum <em>kick-off</em>. Keterlambatan maksimal 15 menit berakibat Walk Out (WO).</li>
            <li style="margin-bottom: 2px;">Skor yang sudah disahkan (<strong>Finished</strong>) bersifat <strong>mutlak dan final</strong>, tidak dapat diganggu gugat.</li>
            <li>Seluruh ofisial dan pemain wajib mematuhi aturan serta menjunjung tinggi sportivitas (<strong>Fair Play</strong>).</li>
          </ol>
          
          <p style="margin-bottom: 5px;">
            Demikian ketetapan ini disampaikan untuk dipedomani. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
          </p>
        </div>

        <!-- TANDA TANGAN -->
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; font-size: 0.9rem; color: #1a1a1a; text-align: center; page-break-inside: avoid; position: relative; z-index: 2;">
          <div style="width: 250px;">
            <p style="margin: 0; margin-bottom: 50px;">Ketua Panitia Pelaksana,</p>
            <p style="margin: 0; font-weight:bold; text-decoration:underline;">Hira</p>
            <p style="margin: 0;">NIP. 19901020 2026 01</p>
          </div>
        </div>

        <div style="margin-top: 40px; font-size: 0.7rem; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 8px; text-align: left; position: relative; z-index: 2;">
          <em>Dokumen diverifikasi elektronik. Dicetak oleh sistem TourneyApp pada ${new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</em>
        </div>
      </div>
    `;

    // HALAMAN 2: LAMPIRAN (DAFTAR TIM)
    let teamCards = this.teams.map((t, i) => {
      return `
        <div class="card" style="page-break-inside: avoid; padding: 12px 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 1.05rem; color: #064e3b;">${i+1}. ${t.name}</strong>
            <span class="status ${t.status === 'Verified' ? 'done' : ''}">${t.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // HELPER: To render individual team box
    const renderNode = (name: string, score: any, isWinner: boolean) => `
      <div style="border: 2px solid ${isWinner ? '#f59e0b' : '#374151'}; border-radius: 4px; padding: 0 10px; background: #fff; width: 140px; height: 36px; display: flex; align-items: center; justify-content: space-between; z-index: 2; position: relative; font-size: 0.75rem; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; color: ${isWinner ? '#b45309' : '#374151'};">${name || 'TBD'}</span>
        <strong style="color: ${isWinner ? '#f59e0b' : '#6b7280'}; font-size: 0.85rem;">${score !== undefined && score !== null ? score : '-'}</strong>
      </div>
    `;

    // Helper: to render a pair connected by a C-shaped border line going right
    const renderPair = (m: any, height: string, includeOutgoing: boolean = true) => {
      let homeWin = m.done && m.homeScore > m.awayScore;
      let awayWin = m.done && m.awayScore > m.homeScore;
      return `
        <div style="display: flex; flex-direction: column; justify-content: space-between; position: relative; height: ${height};">
          <div style="position: absolute; right: -20px; top: 18px; bottom: 18px; width: 20px; border-right: 2px solid #4b5563; border-top: 2px solid #4b5563; border-bottom: 2px solid #4b5563; z-index: 1;"></div>
          ${includeOutgoing ? `<div style="position: absolute; right: -40px; top: 50%; width: 20px; border-top: 2px solid #4b5563; z-index: 1; transform: translateY(-50%);"></div>` : ''}
          ${renderNode(m.home, m.homeScore, homeWin)}
          ${renderNode(m.away, m.awayScore, awayWin)}
        </div>
      `;
    };

    const r1 = this.bracket.quarterFinals;
    const r2 = this.bracket.semiFinals;
    const r3 = this.bracket.final;

    let championName = 'TBD';
    if (r3.done) {
      championName = r3.homeScore > r3.awayScore ? r3.home : (r3.awayScore > r3.homeScore ? r3.away : 'TBD');
    }

    const pdfBracketHTML = `
      <div style="display: flex; justify-content: center; background: transparent; padding: 40px 20px; margin-bottom: 30px; box-sizing: border-box; font-family: sans-serif; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        
        <!-- COL 1: QUARTER FINALS (4 Pairs, height: 96px) -->
        <div style="display: flex; flex-direction: column; width: 140px; margin-right: 40px; justify-content: space-around; height: 480px;">
          ${renderPair(r1[0], '96px')}
          ${renderPair(r1[1], '96px')}
          ${renderPair(r1[2], '96px')}
          ${renderPair(r1[3], '96px')}
        </div>

        <!-- COL 2: SEMI FINALS (2 Pairs, height: 156px) -->
        <div style="display: flex; flex-direction: column; width: 140px; margin-right: 40px; justify-content: space-around; height: 480px;">
          <div>${renderPair(r2[0], '156px')}</div>
          <div>${renderPair(r2[1], '156px')}</div>
        </div>

        <!-- COL 3: FINAL (1 Pair, height: 276px) -->
        <div style="display: flex; flex-direction: column; width: 140px; margin-right: 40px; justify-content: center; height: 480px;">
          <div>${renderPair(r3, '276px', true)}</div>
        </div>

        <!-- COL 4: CHAMPION -->
        <div style="display: flex; flex-direction: column; width: 140px; justify-content: center; position: relative; height: 480px;">
          <div style="display: flex; align-items: center; justify-content: center; position: relative; height: 36px;">
            <ion-icon name="trophy" style="font-size: 4.5rem; color: #f59e0b; position: absolute; bottom: 46px; left: 50%; transform: translateX(-50%); z-index: 2; margin: 0;"></ion-icon>
            <div style="border: 2px solid #f59e0b; border-radius: 4px; padding: 0 10px; background: #fff; width: 140px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: #b45309; text-transform: uppercase; z-index: 2; position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              ${championName}
            </div>
          </div>
        </div>
      </div>
    `;

    const lampiranHTML = `
      <!-- LAMPIRAN (HALAMAN 2+) -->
      <div style="page-break-before: always; margin-top: 20px; padding-top: 20px; position: relative; min-height: 800px;">
        <!-- WATERMARK -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; z-index: 0; pointer-events: none; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <ion-icon name="podium-outline" style="font-size: 450px; color: #000;"></ion-icon>
        </div>

        <div style="text-align: right; margin-bottom: 20px; font-size: 0.8rem; color: #666; font-weight: bold; border-bottom: 1px dashed #ccc; padding-bottom: 10px; position: relative; z-index: 2;">
          LAMPIRAN - DAFTAR PESERTA SURAT NOMOR: 014/LM-MATCH/2026
        </div>
        
        <div class="header" style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #10b981; padding-bottom: 15px;">
          <h2 style="margin: 0; font-size: 1.4rem; color: #064e3b;"><ion-icon name="podium" style="vertical-align: bottom;"></ion-icon> PETA BRACKET & DAFTAR TIM LIGA</h2>
          <p style="margin: 4px 0 0; font-size: 0.85rem; color: #666;">${this.tournamentConfig.name} — ${this.sportPresets[this.tournamentConfig.sportType]?.label || 'Umum'}</p>
        </div>

        ${pdfBracketHTML}

        <div class="card-grid" style="position: relative; z-index: 2;">
          ${teamCards}
        </div>

        <div style="margin-top: 40px; font-size: 0.7rem; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 8px; text-align: right; position: relative; z-index: 2;">
          <em>Dicetak oleh sistem TourneyApp pada ${new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</em>
        </div>
      </div>
    `;

      this.showExportOverlay(html + lampiranHTML);
    } catch (error) {
      console.error('PDF Export Error:', error);
      this.showToast('Gagal memproses PDF. Pastikan data turnamen sudah benar.');
    }
  }

  exportTeamsPDF() {
    let teamCards = this.teams.map((t: any, i: number) => {
      let playerList = t.players.map((p: any) => `<li><strong>#${p.number}</strong> ${p.name}</li>`).join('');
      return `
        <div class="card">
          <div class="card-header">
            <strong>${i+1}. ${t.name}</strong>
            <span class="status ${t.status === 'Verified' ? 'done' : ''}">${t.status}</span>
          </div>
          <div class="card-body">
            <div class="info-row"><strong>Kapten:</strong> ${t.captain}</div>
            <div class="info-row"><strong>Kontak:</strong> ${t.contact}</div>
            <div class="info-row" style="margin-top:8px;"><strong>Roster (${t.players.length} Pemain):</strong></div>
            <ul class="roster-list">
              ${playerList}
            </ul>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="header">
        <h1><ion-icon name="shield" style="vertical-align: bottom;"></ion-icon> DAFTAR TIM PESERTA</h1>
        <p>${this.tournamentConfig.name} — Tourney App</p>
      </div>
      <div class="summary">
        <div class="summary-box"><div class="num">${this.teams.length}</div><div class="label">TOTAL TIM</div></div>
        <div class="summary-box"><div class="num">${this.teams.filter((t: any) => t.status === 'Verified').length}</div><div class="label">VERIFIED</div></div>
        <div class="summary-box"><div class="num">${this.teams.filter((t: any) => t.status === 'Pending').length}</div><div class="label">PENDING</div></div>
      </div>
      <div class="card-grid">
        ${teamCards}
      </div>
      <div class="footer">Dicetak pada ${new Date().toLocaleString('id-ID')} — Tourney App</div>
    `;

    this.showExportOverlay(html);
  }

  private showExportOverlay(bodyContent: string) {
    const existing = document.getElementById('export-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'export-overlay';
    overlay.innerHTML = `
      <style>
        #export-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 99999; background: #f9fafb; overflow-y: auto;
          font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a;
        }
        #export-overlay .export-toolbar {
          position: sticky; top: 0; z-index: 10; display: flex; gap: 10px; 
          padding: calc(18px + env(safe-area-inset-top)) 20px 15px;
          background: #064e3b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); justify-content: flex-end;
        }
        #export-overlay .export-toolbar button {
          padding: 10px 20px; border: none; border-radius: 10px; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
        }
        #export-overlay .btn-print { background: #10b981; color: #fff; }
        #export-overlay .btn-close { background: rgba(255,255,255,0.2); color: #fff; }
        #export-overlay .export-body { padding: 25px 20px 60px; max-width: 800px; margin: 0 auto; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05); min-height: 100vh; }
        
        #export-overlay .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #10b981; padding-bottom: 18px; }
        #export-overlay .header h1 { font-size: 1.3rem; color: #064e3b; margin: 0; }
        #export-overlay .header p { color: #666; font-size: 0.8rem; margin: 4px 0 0; }
        
        #export-overlay .podium, #export-overlay .summary { display: flex; justify-content: center; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
        #export-overlay .podium-item { text-align: center; padding: 12px 20px; border-radius: 12px; border: 2px solid #e5e7eb; min-width: 80px; }
        #export-overlay .podium-item.gold { border-color: #f59e0b; background: #fffbeb; }
        #export-overlay .podium-item .medal { font-size: 1.5rem; }
        #export-overlay .podium-item .name { font-weight: 800; font-size: 0.75rem; margin-top: 4px; }
        
        #export-overlay .summary-box { padding: 10px 18px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb; }
        #export-overlay .summary-box .num { font-size: 1.3rem; font-weight: 900; color: #064e3b; }
        #export-overlay .summary-box .label { font-size: 0.6rem; color: #888; font-weight: 700; }
        
        /* FORMAL SURAT SYSTEM */
        #export-overlay .surat-container { max-width: 800px; margin: 0 auto; background: #fff; box-sizing: border-box; }
        #export-overlay .formal-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 10px; border: 1px solid #d1d5db; }
        #export-overlay .formal-table th, #export-overlay .formal-table td { border: 1px solid #d1d5db; padding: 8px 10px; }
        #export-overlay .formal-table th { background-color: #064e3b; color: #fff; font-weight: bold; }
        #export-overlay .formal-table td { color: #1a1a1a; }
        
        /* CARD SYSTEM */
        #export-overlay .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 20px; }
        #export-overlay .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; background: #fff; page-break-inside: avoid; }
        #export-overlay .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 10px; }
        #export-overlay .status { padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; background: #fef3c7; color: #92400e; }
        #export-overlay .status.done { background: #d1fae5; color: #065f46; }
        #export-overlay .match-body { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 1rem; margin-bottom: 15px; }
        #export-overlay .match-body .team { flex: 1; text-align: center; }
        #export-overlay .match-body .score { background: #064e3b; color: #fff; padding: 5px 12px; border-radius: 8px; font-size: 1.1rem; }
        #export-overlay .card-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #666; font-weight: 600; }
        #export-overlay .roster-list { list-style: none; margin-top: 5px; font-size: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 0; }
        #export-overlay .info-row { font-size: 0.85rem; color: #444; }

        #export-overlay .footer { text-align: center; margin-top: 25px; font-size: 0.65rem; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        
        /* FIX THE "NYATU" PRINT BUG, BROWSER HEADER, AND MULTI-PAGE TRUNCATION */
        @page { margin: 0mm; size: auto; }
        @media print {
          html, body { height: auto !important; min-height: 100% !important; overflow: visible !important; position: static !important; }
          body > *:not(#export-overlay) { display: none !important; }
          #export-overlay { position: static !important; display: block !important; overflow: visible !important; background: transparent !important; height: auto !important; }
          #export-overlay .export-toolbar { display: none !important; }
          #export-overlay .export-body { box-shadow: none !important; padding: 10mm 15mm !important; margin: 0 !important; max-width: 100% !important; min-height: auto !important; }
          .card { border: 1px solid #000; break-inside: avoid; }
        }
      </style>
      <div class="export-toolbar">
        <button class="btn-print" onclick="window.downloadPDF()"><ion-icon name="download-outline"></ion-icon> Simpan PDF</button>
        <button class="btn-print" style="background:#6366f1" onclick="window.print()"><ion-icon name="print-outline"></ion-icon> Cetak</button>
        <button class="btn-close" onclick="document.getElementById('export-overlay').remove()"><ion-icon name="close-outline"></ion-icon> Tutup</button>
      </div>
      <script>
        window.downloadPDF = function() {
          const element = document.querySelector('.export-body');
          const opt = {
            margin: [10, 10],
            filename: 'Tournament_Export.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          // Show loading
          const btn = document.querySelector('.btn-print');
          const originalText = btn.innerHTML;
          btn.innerHTML = 'Memproses...';
          btn.disabled = true;

          html2pdf().set(opt).from(element).save().then(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }).catch(err => {
            alert('Gagal mengunduh PDF: ' + err);
            btn.innerHTML = originalText;
            btn.disabled = false;
          });
        };
      </script>
      <div class="export-body">
        ${bodyContent}
      </div>
    `;

    document.body.appendChild(overlay);
  }

}
