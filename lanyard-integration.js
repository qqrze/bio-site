// Простая интеграция через Lanyard API (самый простой способ)
class LanyardIntegration {
    constructor(userId) {
        this.userId = userId;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.init();
    }

    async init() {
        try {
            await this.fetchInitialStatus();
            this.connectWebSocket();
        } catch (error) {
            console.log('Lanyard API недоступен, используем fallback');
            this.useFallback();
        }
    }

    async fetchInitialStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`https://api.lanyard.rest/v1/users/${this.userId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateStatus(data.data);
                    return true;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Lanyard API request timed out');
            } else {
                console.log('Ошибка получения статуса:', error);
            }
        }
        return false;
    }

    connectWebSocket() {
        this.websocket = new WebSocket('wss://api.lanyard.rest/socket');

        this.websocket.onopen = () => {
            console.log('Подключен к Lanyard WebSocket');
            this.reconnectAttempts = 0;
            
            // Подписываемся на обновления пользователя
            this.websocket.send(JSON.stringify({
                op: 2,
                d: {
                    subscribe_to_id: this.userId
                }
            }));
        };

        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket сообщение:', data);
            
            if (data.op === 1) {
                // Отвечаем на heartbeat
                this.websocket.send(JSON.stringify({ op: 3 }));
            } else if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                this.updateStatus(data.d);
            }
        };

        this.websocket.onclose = (event) => {
            console.log('Соединение с Lanyard закрыто', event.code, event.reason);
            if (!event.wasClean) {
                this.attemptReconnect();
            }
        };

        this.websocket.onerror = (error) => {
            console.log('Ошибка WebSocket:', error);
            // Don't attempt reconnect here, let onclose handle it
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, 3000 * this.reconnectAttempts);
        } else {
            console.log('Максимум попыток переподключения достигнут, используем fallback');
            this.useFallback();
        }
    }

    updateStatus(userData) {
        console.log('Обновляем статус:', userData);
        
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (!statusDot || !statusText) {
            console.log('Статус элементы не найдены на странице');
            return;
        }

        const status = userData.discord_status;
        const activities = userData.activities || [];
        
        console.log('Discord статус:', status, 'Активности:', activities);

        const statusConfig = {
            online: { color: '#555', text: 'Online', shadow: '0 0 5px #555' },
            idle: { color: '#666', text: 'Away', shadow: '0 0 5px #666' },
            dnd: { color: '#777', text: 'Busy', shadow: '0 0 5px #777' },
            offline: { color: '#333', text: 'Offline', shadow: '0 0 5px #333' }
        };

        const config = statusConfig[status] || statusConfig.offline;
        
        statusDot.style.background = config.color;
        statusDot.style.boxShadow = config.shadow;
        statusText.textContent = config.text;
        statusText.style.color = config.color;

        // Обновляем активность
        this.updateActivity(activities, status);
    }

    updateActivity(activities, status) {
        let activityElement = document.querySelector('.discord-activity');
        
        if (!activityElement) {
            activityElement = document.createElement('div');
            activityElement.className = 'discord-activity';
            document.querySelector('.profile-info').appendChild(activityElement);
        }

        // Ищем игру или другую активность (исключаем Spotify и Custom Status)
        const gameActivity = activities.find(activity => 
            activity.type === 0 && // Playing
            activity.name !== 'Spotify' &&
            activity.name !== 'Custom Status'
        );

        const customStatus = activities.find(activity => 
            activity.type === 4 // Custom Status
        );

        const spotifyActivity = activities.find(activity => 
            activity.name === 'Spotify'
        );

        if (gameActivity && status !== 'offline') {
            activityElement.innerHTML = `
                <div class="activity-info">
                    <span class="activity-type">Playing</span>
                    <span class="activity-name">${gameActivity.name}</span>
                    ${gameActivity.details ? `<span class="activity-details">${gameActivity.details}</span>` : ''}
                </div>
            `;
            activityElement.style.display = 'block';
        } else if (spotifyActivity && status !== 'offline') {
            activityElement.innerHTML = `
                <div class="activity-info">
                    <span class="activity-type">Listening to</span>
                    <span class="activity-name">Spotify</span>
                    ${spotifyActivity.details ? `<span class="activity-details">${spotifyActivity.details} - ${spotifyActivity.state}</span>` : ''}
                </div>
            `;
            activityElement.style.display = 'block';
        } else if (customStatus && customStatus.state && status !== 'offline') {
            activityElement.innerHTML = `
                <div class="activity-info">
                    <span class="activity-type">Status</span>
                    <span class="activity-name">${customStatus.emoji ? customStatus.emoji.name + ' ' : ''}${customStatus.state}</span>
                </div>
            `;
            activityElement.style.display = 'block';
        } else {
            activityElement.style.display = 'none';
        }
    }

    useFallback() {
        console.log('Используем fallback режим');
        // Простая система fallback на основе времени
        const updateFallbackStatus = () => {
            const now = new Date();
            const hour = now.getHours();
            let status;
            
            if (hour >= 9 && hour <= 23) {
                status = Math.random() > 0.4 ? 'online' : 'idle';
            } else {
                status = Math.random() > 0.8 ? 'dnd' : 'offline';
            }
            
            console.log('Fallback статус:', status);
            this.updateStatus({ discord_status: status, activities: [] });
        };

        updateFallbackStatus();
        setInterval(updateFallbackStatus, 60000); // Обновляем каждую минуту
    }

    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

// Простая инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Ваш Discord User ID
    const DISCORD_USER_ID = '1413802676776337469';
    
    console.log('Инициализируем Lanyard интеграцию для пользователя:', DISCORD_USER_ID);
    window.lanyardIntegration = new LanyardIntegration(DISCORD_USER_ID);
});

window.addEventListener('beforeunload', () => {
    if (window.lanyardIntegration) {
        window.lanyardIntegration.destroy();
    }
});