/**
 * ParticleSystem - Creates and manages interactive particle effects
 * Optimized for performance with limited particle count and efficient rendering
 */
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.maxParticles = 50; // Limit total particles for performance
        this.resize();
        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.createParticle(e.clientX, e.clientY);
        });
        this.animate();
    }

    createParticle(x, y) {
        // Reduce to 1 particle per mouse move and make smaller
        if (this.particles.length < this.maxParticles) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10, // Smaller spread
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2, // Slower velocity
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                decay: Math.random() * 0.03 + 0.02, // Faster decay
                size: Math.random() * 1.5 + 1, // Smaller size: 1-2.5px
                color: `hsl(${0 + Math.random() * 60}, 30%, ${20 + Math.random() * 20}%)`
            });
        }
    }

    updateParticles() {
        // Use more efficient loop and add gravity only occasionally
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            // Reduce gravity effect for better performance
            if (Math.random() < 0.3) { // Only apply gravity 30% of the time
                particle.vy += 0.05;
            }

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Batch rendering for better performance
        this.ctx.save();
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life;
            this.ctx.shadowBlur = 10; // Reduced shadow blur
            this.ctx.shadowColor = particle.color;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        // Use setTimeout for controlled frame rate to reduce CPU usage
        setTimeout(() => requestAnimationFrame(() => this.animate()), 16); // ~60fps
    }
}

/**
 * SoundManager - Handles all audio effects and background music
 * Manages sound playback with proper error handling and volume control
 */
class SoundManager {
    constructor() {
        this.sounds = {
            click: document.getElementById('click-sound'),
            hover: document.getElementById('hover-sound'),
            scroll: document.getElementById('scroll-sound'),
            music: document.getElementById('music')
        };
        this.isPlaying = false;
        this.init();
    }

    init() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.3;
            }
        });
        
        if (this.sounds.music) {
            this.sounds.music.volume = 0.15;
        }

        this.setupEventListeners();
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                sound.currentTime = 0;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log('Sound play failed:', e);
                        // Could show user notification here if needed
                    });
                }
            } catch (error) {
                console.log('Error playing sound:', error);
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('click', () => this.play('click'));
        
        document.querySelectorAll('.social-button, .avatar, .banner, .control-btn').forEach(element => {
            element.addEventListener('mouseenter', () => this.play('hover'));
        });
        
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            this.play('scroll');
            scrollTimeout = setTimeout(() => {}, 100);
        });
    }

    toggleMusic() {
        const music = this.sounds.music;
        if (!music) return '▶️';

        try {
            if (this.isPlaying) {
                music.pause();
                this.isPlaying = false;
                return '▶️';
            } else {
                const playPromise = music.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.isPlaying = true;
                    }).catch(e => {
                        console.log('Music play failed:', e);
                        this.isPlaying = false;
                        // Could show user notification here
                    });
                }
                return '⏸️';
            }
        } catch (error) {
            console.log('Error toggling music:', error);
            return '▶️';
        }
    }
}

/**
 * LoadingScreen - Manages the initial loading animation and transition
 * Provides smooth loading experience with progress simulation
 */
class LoadingScreen {
    constructor() {
        this.loader = document.getElementById('loader');
        this.mainContent = document.getElementById('main-content');
        this.progress = 0;
        this.init();
    }

    init() {
        this.simulateLoading();
    }

    simulateLoading() {
        const interval = setInterval(() => {
            this.progress += Math.random() * 15 + 5;
            if (this.progress >= 100) {
                this.progress = 100;
                clearInterval(interval);
                setTimeout(() => this.hideLoader(), 500);
            }
        }, 200);
    }

    hideLoader() {
        this.loader.style.opacity = '0';
        this.loader.style.visibility = 'hidden';
        
        setTimeout(() => {
            this.mainContent.classList.remove('hidden');
            this.mainContent.style.opacity = '1';
        }, 500);
    }
}

class TimeDisplay {
    constructor() {
        this.timeElement = document.getElementById('current-time');
        this.init();
    }

    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        if (this.timeElement) {
            this.timeElement.textContent = timeString;
        }
    }
}

class CustomCursor {
    constructor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
        });

        document.addEventListener('mousedown', () => {
            this.cursor.classList.add('clicked');
        });

        document.addEventListener('mouseup', () => {
            this.cursor.classList.remove('clicked');
        });
    }
}

/**
 * ProfileInteractions - Handles all user interactions with profile elements
 * Manages social links, music player, and avatar effects
 */
class ProfileInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupSocialLinks();
        this.setupMusicPlayer();
        this.setupAvatarEffects();
    }

    setupSocialLinks() {
        const socialButtons = document.querySelectorAll('.social-button');
        socialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const buttonType = button.classList[1];
                this.handleSocialClick(buttonType, button);
            });

            // Add hover tooltip
            button.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, buttonType);
            });

            button.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    handleSocialClick(type, button) {
        const links = {
            discord: 'https://discord.gg/yourinvite',
            telegram: 'https://t.me/yourusername',
            github: 'https://github.com/yourusername'
        };

        if (links[type]) {
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
                window.open(links[type], '_blank');
            }, 150);
        }
    }

    showTooltip(element, type) {
        const tooltips = {
            discord: 'Join my Discord server',
            telegram: 'Message me on Telegram',
            github: 'Check out my code'
        };

        const tooltip = document.createElement('div');
        tooltip.className = 'social-tooltip';
        tooltip.textContent = tooltips[type] || 'Visit my profile';

        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 0.5rem 0.8rem;
            border-radius: 5px;
            font-size: 0.7rem;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: tooltipFadeIn 0.2s ease-out;
        `;

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - 50 + 'px';
        tooltip.style.top = rect.top - 35 + 'px';

        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.style.animation = 'tooltipFadeOut 0.2s ease-out';
            setTimeout(() => {
                if (this.currentTooltip) {
                    this.currentTooltip.remove();
                    this.currentTooltip = null;
                }
            }, 200);
        }
    }

    setupMusicPlayer() {
        const playButton = document.getElementById('play-pause');
        const soundManager = new SoundManager();

        if (playButton) {
            playButton.addEventListener('click', () => {
                const newIcon = soundManager.toggleMusic();
                playButton.textContent = newIcon;
                // Update accessibility attributes
                const isPlaying = newIcon === '⏸️';
                playButton.setAttribute('aria-pressed', isPlaying.toString());
                playButton.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
            });
        }
    }

    /**
     * Sets up interactive effects for avatar and profile card
     * Includes click animations, modal display, and 3D tilt effects
     */
    setupAvatarEffects() {
        const avatar = document.querySelector('.avatar');
        const profileCard = document.querySelector('.profile-card');

        if (avatar) {
            avatar.addEventListener('click', () => {
                avatar.style.animation = 'none';
                avatar.offsetHeight;
                avatar.style.animation = 'avatarPulse 4s ease-in-out infinite';
                // Add click feedback
                this.createClickEffect(avatar);
            });

            // Add double-click effect
            avatar.addEventListener('dblclick', () => {
                this.showAvatarModal();
            });
        }

        if (profileCard) {
            profileCard.addEventListener('mousemove', (e) => {
                const rect = profileCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = -(x - centerX) / 10;

                profileCard.style.transform = `translateZ(-20px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            profileCard.addEventListener('mouseleave', () => {
                profileCard.style.transform = 'translateZ(0) rotateX(0) rotateY(0)';
            });

            // Add card click effect
            profileCard.addEventListener('click', (e) => {
                if (!e.target.closest('.social-button') && !e.target.closest('.avatar')) {
                    this.createCardRipple(e);
                }
            });
        }
    }

    createClickEffect(element) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.position = 'absolute';
        effect.style.width = '20px';
        effect.style.height = '20px';
        effect.style.borderRadius = '50%';
        effect.style.background = 'rgba(255, 255, 255, 0.6)';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'clickRipple 0.6s ease-out forwards';

        const rect = element.getBoundingClientRect();
        effect.style.left = (rect.width / 2 - 10) + 'px';
        effect.style.top = (rect.height / 2 - 10) + 'px';

        element.style.position = 'relative';
        element.appendChild(effect);

        setTimeout(() => effect.remove(), 600);
    }

    createCardRipple(e) {
        const card = e.currentTarget;
        const ripple = document.createElement('div');
        ripple.className = 'card-ripple';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.1)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'cardRipple 0.8s ease-out forwards';

        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

        card.style.position = 'relative';
        card.appendChild(ripple);

        setTimeout(() => ripple.remove(), 800);
    }

    showAvatarModal() {
        const modal = document.createElement('div');
        modal.className = 'avatar-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <img src="img/avatar.svg" alt="Avatar" class="modal-avatar">
                <p>qqrze</p>
                <button class="modal-close">×</button>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => modal.remove(), 300);
            }
        });

        document.body.appendChild(modal);
    }
}

class BackgroundEffects {
    constructor() {
        this.init();
    }

    init() {
        this.setupVideoEffects();
        this.setupScrollEffects();
    }

    setupVideoEffects() {
        const bgGradient = document.getElementById('bg-gradient');
        if (bgGradient) {
            bgGradient.style.opacity = '1';
        }
    }

    setupScrollEffects() {
        let ticking = false;
        
        document.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.3;
        
        const bgGradient = document.getElementById('bg-gradient');
        if (bgGradient) {
            bgGradient.style.transform = `translateY(${parallax}px)`;
        }
    }
}

class ResponsiveHandler {
    constructor() {
        this.init();
    }

    init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        // Disable particles on mobile devices
        this.handleMobileParticles();
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const profileCard = document.querySelector('.profile-card');

        if (profileCard && isMobile) {
            profileCard.style.transform = 'none';
        }
    }

    handleMobileParticles() {
        // Disable particle system on mobile for performance
        if (window.innerWidth <= 768) {
            const particlesCanvas = document.getElementById('particles');
            if (particlesCanvas) {
                particlesCanvas.style.display = 'none';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoadingScreen();
    new ParticleSystem();
    new TimeDisplay();
    new CustomCursor();
    new ProfileInteractions();
    new BackgroundEffects();
    new ResponsiveHandler();
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Allow keyboard navigation for accessibility
    if (e.key === 'Tab') {
        // Tab navigation is allowed
        return;
    }

    // Space or Enter to activate buttons
    if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('social-button')) {
        e.preventDefault();
        e.target.click();
    }

    // Space or Enter for music player
    if ((e.key === ' ' || e.key === 'Enter') && e.target.id === 'play-pause') {
        e.preventDefault();
        e.target.click();
    }

    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.querySelector('.avatar-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }
    }
});

window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    return '';
});