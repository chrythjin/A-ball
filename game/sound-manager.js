// game/sound-manager.js

class SoundSynthesisManager {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('game_muted') === 'true';
    this.masterVolume = parseFloat(localStorage.getItem('game_volume') || '0.7');
    this.bgmVolumeNode = null;
    this.sfxVolumeNode = null;
    this.mainGain = null;
    this.noiseBuffer = null;

    // BGM Scheduling State
    this.currentBgmType = null; // 'lobby', 'ingame', 'gameover'
    this.currentBgmTrack = null;
    this.bgmTrackSelection = 'auto'; // 'auto', 'ingame1', 'ingame2', 'ingame3'
    this.bgmIntervalId = null;
    this.bgmSequenceStep = 0;
    this.bgmSynths = []; // Active nodes playing BGM to stop on track switch

    // Echo/Delay node for ambient space effects
    this.delayNode = null;
    this.delayGain = null;
  }

  init() {
    if (this.audioCtx) return;

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Main routing chain
      this.mainGain = this.audioCtx.createGain();
      this.mainGain.gain.value = this.muted ? 0 : this.masterVolume;
      this.mainGain.connect(this.audioCtx.destination);

      // Separate gain nodes for BGM and SFX
      this.bgmVolumeNode = this.audioCtx.createGain();
      this.bgmVolumeNode.gain.value = 0.9;
      this.bgmVolumeNode.connect(this.mainGain);

      this.sfxVolumeNode = this.audioCtx.createGain();
      this.sfxVolumeNode.gain.value = 1.0;
      this.sfxVolumeNode.connect(this.mainGain);

      // Setup global Delay / Echo node for procedural ambient synthesis
      this.delayNode = this.audioCtx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.35; // Echo time
      this.delayGain = this.audioCtx.createGain();
      this.delayGain.gain.value = 0.3; // Echo feedback volume

      // Connect delay in feedback loop
      this.delayNode.connect(this.delayGain);
      this.delayGain.connect(this.delayNode);
      this.delayGain.connect(this.bgmVolumeNode); // Route echo output to BGM gain

      // Generate White Noise Buffer for explosions/SFX
      const bufferSize = this.audioCtx.sampleRate * 1.5; // 1.5 seconds of noise
      this.noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      console.log('Procedural Audio Synthesis Engine initialized.');
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.resume();
    this.muted = !this.muted;
    localStorage.setItem('game_muted', this.muted ? 'true' : 'false');
    
    if (this.mainGain) {
      // Smooth volume transition to avoid clicks
      const targetVol = this.muted ? 0 : this.masterVolume;
      this.mainGain.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.05);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setVolume(vol) {
    this.resume();
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterVolume = clamped;
    localStorage.setItem('game_volume', String(clamped));
    
    if (this.mainGain && !this.muted) {
      this.mainGain.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.05);
    }
  }

  getVolume() {
    return this.masterVolume;
  }

  setBGMTrack(track) {
    this.bgmTrackSelection = track;
    if (this.currentBgmType === 'ingame') {
      this.currentBgmType = null;
      this.currentBgmTrack = null;
      this.playBGM('ingame');
    }
  }

  // --- PROCEDURAL SFX SYNTHESIS ---
  playSFX(name) {
    this.resume();
    if (!this.audioCtx || this.muted) return;

    const t = this.audioCtx.currentTime;

    try {
      switch (name) {
        case 'ball-launch': {
          // Quick pitch sweep downwards (Sine wave)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580, t);
          osc.frequency.exponentialRampToValueAtTime(160, t + 0.08);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.08);
          break;
        }

        case 'ball-wall': {
          // Fast click/blip (Triangle wave)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, t);
          osc.frequency.setValueAtTime(800, t + 0.01);

          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.03);
          break;
        }

        case 'ball-hit': {
          // Juicy impact pop (Square wave mixed with a bit of bass)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.09);
          break;
        }

        case 'ball-collect': {
          // Rising bubble sweep (Sine wave)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, t);
          osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.07);
          break;
        }

        case 'ball-all-collected': {
          // Double futuristic chime chord
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.05);

            gain.gain.setValueAtTime(0.15, t + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(t + idx * 0.05);
            osc.stop(t + idx * 0.05 + 0.2);
          });
          break;
        }

        case 'enemy-kill': {
          // White noise explosion + low bass thud
          if (this.noiseBuffer) {
            const noiseNode = this.audioCtx.createBufferSource();
            noiseNode.buffer = this.noiseBuffer;

            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(1000, t);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.35, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            noiseNode.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.sfxVolumeNode);
            noiseNode.start(t);
            noiseNode.stop(t + 0.25);
          }

          // Low bass rumble
          const subOsc = this.audioCtx.createOscillator();
          const subGain = this.audioCtx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(150, t);
          subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

          subGain.gain.setValueAtTime(0.3, t);
          subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

          subOsc.connect(subGain);
          subGain.connect(this.sfxVolumeNode);
          subOsc.start(t);
          subOsc.stop(t + 0.2);
          break;
        }

        case 'enemy-spawn': {
          // Low cyber sweep "wub"
          const osc = this.audioCtx.createOscillator();
          const filter = this.audioCtx.createBiquadFilter();
          const gain = this.audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, t);
          osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(150, t);
          filter.frequency.exponentialRampToValueAtTime(600, t + 0.35);

          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.35);
          break;
        }

        case 'enemy-descend': {
          // Heavy mechanical engine thud
          const osc = this.audioCtx.createOscillator();
          const filter = this.audioCtx.createBiquadFilter();
          const gain = this.audioCtx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(110, t);
          osc.frequency.setValueAtTime(55, t + 0.1);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);
          filter.frequency.exponentialRampToValueAtTime(60, t + 0.3);

          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.3);
          break;
        }

        case 'enemy-deadline': {
          // Dual retro alarm sirens
          for (let i = 0; i < 2; i++) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            // Alternating alarms
            const freq = i === 0 ? 380 : 480;
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.setValueAtTime(freq - 100, t + 0.15);

            gain.gain.setValueAtTime(0.1, t);
            gain.gain.setValueAtTime(0.1, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(t);
            osc.stop(t + 0.3);
          }
          break;
        }

        case 'ui-start': {
          // Digital retro arcade scale sweeps upwards
          const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
          scale.forEach((freq, idx) => {
            const noteTime = t + idx * 0.05;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.12, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(noteTime);
            osc.stop(noteTime + 0.12);
          });
          break;
        }

        case 'ui-click': {
          // Subtle retro toggle switch
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1000, t);
          osc.frequency.setValueAtTime(500, t + 0.01);

          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.04);
          break;
        }

        case 'ui-hover': {
          // Tiny soft chirp
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, t);
          osc.frequency.exponentialRampToValueAtTime(900, t + 0.02);

          gain.gain.setValueAtTime(0.03, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.02);
          break;
        }

        case 'gameover': {
          // Low dramatic sweep downwards ending in complex minor chord
          const sub = this.audioCtx.createOscillator();
          const gainSub = this.audioCtx.createGain();

          sub.type = 'sawtooth';
          sub.frequency.setValueAtTime(120, t);
          sub.frequency.exponentialRampToValueAtTime(30, t + 1.2);

          gainSub.gain.setValueAtTime(0.25, t);
          gainSub.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

          sub.connect(gainSub);
          gainSub.connect(this.sfxVolumeNode);
          sub.start(t);
          sub.stop(t + 1.2);

          // Dark minor chord (A minor)
          const minorChord = [110.00, 130.81, 164.81]; // A2, C3, E3
          minorChord.forEach((freq) => {
            const osc = this.audioCtx.createOscillator();
            const filter = this.audioCtx.createBiquadFilter();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + 0.1);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, t);
            filter.frequency.exponentialRampToValueAtTime(80, t + 1.5);

            gain.gain.setValueAtTime(0.15, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(t + 0.1);
            osc.stop(t + 1.5);
          });
          break;
        }

        case 'screen-shake': {
          // Sub-bass heavy rumble (Sine wave)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(45, t);
          osc.frequency.linearRampToValueAtTime(35, t + 0.35);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.35);
          break;
        }

        case 'skill-popup': {
          // Magical glass digital chime
          const chimeNotes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
          chimeNotes.forEach((freq, idx) => {
            const noteT = t + idx * 0.04;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteT);

            gain.gain.setValueAtTime(0.12, noteT);
            gain.gain.exponentialRampToValueAtTime(0.01, noteT + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(noteT);
            osc.stop(noteT + 0.25);
          });
          break;
        }

        case 'skill-power': {
          // Ascending powerful engine roar
          const osc = this.audioCtx.createOscillator();
          const filter = this.audioCtx.createBiquadFilter();
          const gain = this.audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, t);
          osc.frequency.exponentialRampToValueAtTime(400, t + 0.4);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);
          filter.frequency.exponentialRampToValueAtTime(900, t + 0.4);

          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.4);
          break;
        }

        case 'skill-multi': {
          // Cascading tri-tone clone chirp
          const scale = [440, 523.25, 622.25]; // Diminished-like cyber chime
          scale.forEach((freq, idx) => {
            const noteT = t + idx * 0.08;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteT);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, noteT + 0.12);

            gain.gain.setValueAtTime(0.15, noteT);
            gain.gain.exponentialRampToValueAtTime(0.01, noteT + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxVolumeNode);
            osc.start(noteT);
            osc.stop(noteT + 0.12);
          });
          break;
        }

        case 'skill-speed': {
          // Lightning hyper sweep
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(2400, t + 0.45);

          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          osc.connect(gain);
          gain.connect(this.sfxVolumeNode);
          osc.start(t);
          osc.stop(t + 0.45);
          break;
        }
      }
    } catch (e) {
      console.warn('Procedural SFX Playback error:', e);
    }
  }

  // --- PROCEDURAL BGM ENGINE (REAL-TIME SEQUENCED TRACKS) ---
  playBGM(type, stage = 1) {
    this.resume();
    if (!this.audioCtx) return;

    let actualType = type;
    if (type === 'ingame') {
      if (this.bgmTrackSelection === 'auto') {
        if (stage === 1) actualType = 'ingame1';
        else if (stage === 2) actualType = 'ingame2';
        else actualType = 'ingame3';
      } else {
        actualType = this.bgmTrackSelection;
      }
    }

    if (this.currentBgmType === type && this.currentBgmTrack === actualType) return;

    this.stopBGM();
    this.currentBgmType = type;
    this.currentBgmTrack = actualType;
    this.bgmSequenceStep = 0;

    console.log(`Starting BGM: ${type} (${actualType})`);

    if (type === 'lobby') {
      const lobbyChordSequence = [
        [110.00, 220.00, 261.63, 329.63],
        [87.31, 174.61, 220.00, 261.63],
        [130.81, 261.63, 329.63, 392.00],
        [98.00, 196.00, 246.94, 293.66]
      ];

      const playLobbyChord = () => {
        if (this.muted || this.currentBgmType !== 'lobby') return;
        const chord = lobbyChordSequence[this.bgmSequenceStep % lobbyChordSequence.length];
        this.bgmSequenceStep++;

        const t = this.audioCtx.currentTime;

        chord.forEach((freq, index) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const filter = this.audioCtx.createBiquadFilter();

          osc.type = 'sine';
          const noteTime = t + index * 0.05;
          osc.frequency.setValueAtTime(freq, noteTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(350, noteTime);

          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.6);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 3.8);

          osc.connect(filter);
          filter.connect(gain);
          
          gain.connect(this.bgmVolumeNode);
          if (this.delayNode) {
            gain.connect(this.delayNode);
          }

          osc.start(noteTime);
          osc.stop(noteTime + 3.9);

          this.bgmSynths.push(osc);
        });

        this.bgmSynths = this.bgmSynths.slice(-30);
      };

      playLobbyChord();
      this.bgmIntervalId = setInterval(playLobbyChord, 4000);

    } else if (actualType === 'ingame1') {
      const bassSeq = [
        110.00, 110.00, 110.00, 110.00,
        130.81, 130.81, 130.81, 130.81,
        98.00,  98.00,  98.00,  98.00,
        87.31,  87.31,  116.54, 116.54
      ];

      const melodySeq = [
        [440, 523, 659, 784],
        [349, 440, 523, 698],
        [523, 659, 784, 987],
        [392, 494, 587, 784]
      ];

      const playIngameTick = () => {
        if (this.muted || this.currentBgmType !== 'ingame') return;
        
        const t = this.audioCtx.currentTime;
        const eighthIdx = this.bgmSequenceStep % 16;
        const measureIdx = Math.floor(this.bgmSequenceStep / 16) % 4;
        
        this.bgmSequenceStep++;

        const bassFreq = bassSeq[eighthIdx];
        const bassOsc = this.audioCtx.createOscillator();
        const bassFilter = this.audioCtx.createBiquadFilter();
        const bassGain = this.audioCtx.createGain();

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(180, t);
        bassFilter.frequency.exponentialRampToValueAtTime(320, t + 0.08);

        bassGain.gain.setValueAtTime(0.18, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmVolumeNode);

        bassOsc.start(t);
        bassOsc.stop(t + 0.23);
        this.bgmSynths.push(bassOsc);

        if (eighthIdx % 4 === 0) {
          const melodyNoteIdx = (eighthIdx / 4);
          const melodyFreq = melodySeq[measureIdx][melodyNoteIdx];

          const melOsc = this.audioCtx.createOscillator();
          const melGain = this.audioCtx.createGain();
          
          melOsc.type = 'sine';
          melOsc.frequency.setValueAtTime(melodyFreq, t);

          melGain.gain.setValueAtTime(0.06, t);
          melGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

          melOsc.connect(melGain);
          melGain.connect(this.bgmVolumeNode);
          if (this.delayNode) {
            melGain.connect(this.delayNode);
          }

          melOsc.start(t);
          melOsc.stop(t + 0.36);
          this.bgmSynths.push(melOsc);
        }

        this.bgmSynths = this.bgmSynths.slice(-30);
      };

      playIngameTick();
      this.bgmIntervalId = setInterval(playIngameTick, 250);

    } else if (actualType === 'ingame2') {
      const bassSeq2 = [
        55.00, 55.00, 82.41, 55.00,
        48.99, 48.99, 73.42, 48.99
      ];

      const playIngame2Tick = () => {
        if (this.muted || this.currentBgmType !== 'ingame') return;
        const t = this.audioCtx.currentTime;
        const idx = this.bgmSequenceStep % 8;
        this.bgmSequenceStep++;

        const osc = this.audioCtx.createOscillator();
        const filter = this.audioCtx.createBiquadFilter();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassSeq2[idx], t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.25);

        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmVolumeNode);

        osc.start(t);
        osc.stop(t + 0.31);
        this.bgmSynths.push(osc);

        if (idx % 4 === 0) {
          const click = this.audioCtx.createOscillator();
          const clickGain = this.audioCtx.createGain();
          click.type = 'sine';
          click.frequency.setValueAtTime(idx === 0 ? 1000 : 600, t);
          clickGain.gain.setValueAtTime(0.04, t);
          clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          click.connect(clickGain);
          clickGain.connect(this.bgmVolumeNode);
          if (this.delayNode) {
            clickGain.connect(this.delayNode);
          }
          click.start(t);
          click.stop(t + 0.16);
          this.bgmSynths.push(click);
        }

        this.bgmSynths = this.bgmSynths.slice(-30);
      };

      playIngame2Tick();
      this.bgmIntervalId = setInterval(playIngame2Tick, 333);

    } else if (actualType === 'ingame3') {
      const melSeq3 = [440, 523, 659, 784, 880, 784, 659, 523];

      const playIngame3Tick = () => {
        if (this.muted || this.currentBgmType !== 'ingame') return;
        const t = this.audioCtx.currentTime;
        const idx = this.bgmSequenceStep % 8;
        this.bgmSequenceStep++;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(melSeq3[idx], t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.bgmVolumeNode);
        if (this.delayNode) {
          gain.connect(this.delayNode);
        }

        osc.start(t);
        osc.stop(t + 0.19);
        this.bgmSynths.push(osc);

        if (idx % 2 === 0) {
          const sub = this.audioCtx.createOscillator();
          const subGain = this.audioCtx.createGain();
          sub.type = 'triangle';
          sub.frequency.setValueAtTime(55, t);
          subGain.gain.setValueAtTime(0.2, t);
          subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          sub.connect(subGain);
          subGain.connect(this.bgmVolumeNode);
          sub.start(t);
          sub.stop(t + 0.19);
          this.bgmSynths.push(sub);
        }

        this.bgmSynths = this.bgmSynths.slice(-30);
      };

      playIngame3Tick();
      this.bgmIntervalId = setInterval(playIngame3Tick, 214);

    } else if (type === 'gameover') {
      const gameoverChordSequence = [
        [55.00, 110.00, 130.81, 164.81],
        [48.99, 98.00,  116.54, 146.83]
      ];

      const playGameoverChord = () => {
        if (this.muted || this.currentBgmType !== 'gameover') return;
        const chord = gameoverChordSequence[this.bgmSequenceStep % gameoverChordSequence.length];
        this.bgmSequenceStep++;

        const t = this.audioCtx.currentTime;

        chord.forEach((freq) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const filter = this.audioCtx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(150, t);
          filter.frequency.exponentialRampToValueAtTime(80, t + 4.5);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 4.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.bgmVolumeNode);

          osc.start(t);
          osc.stop(t + 4.9);

          this.bgmSynths.push(osc);
        });

        this.bgmSynths = this.bgmSynths.slice(-30);
      };

      playGameoverChord();
      this.bgmIntervalId = setInterval(playGameoverChord, 5000);
    }
  }

  stopBGM() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    
    this.bgmSynths.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
      }
    });
    this.bgmSynths = [];
    this.currentBgmType = null;
    this.currentBgmTrack = null;
  }
}

export const soundManager = new SoundSynthesisManager();
