// Tutorial Tour System
class TutorialTour {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.tourSteps = [
            {
                element: '.sidebar-header .avatar',
                title: '👋 Welcome to TeShaN Chat!',
                content: 'This is your profile avatar. Click it to edit your profile and change your picture.',
                position: 'right',
                action: null
            },
            {
                element: '.search-box',
                title: '🔍 Search Users',
                content: 'Search for other users here to start private conversations.',
                position: 'bottom',
                action: null
            },
            {
                element: '.rooms-section',
                title: '💬 Chat Rooms',
                content: 'Join different rooms to chat with groups of people. "General" is always available.',
                position: 'right',
                action: null
            },
            {
                element: '.users-section',
                title: '🟢 Online Users',
                content: 'See who\'s currently online and available to chat.',
                position: 'right',
                action: null
            },
            {
                element: '.private-chats-section',
                title: '👥 Private Chats',
                content: 'Your one-on-one conversations appear here. Click "+ Start Private Chat" to begin.',
                position: 'right',
                action: null
            },
            {
                element: '.chat-header .back-btn',
                title: '☰ Mobile Menu',
                content: 'On mobile, use this button to show/hide the sidebar.',
                position: 'bottom',
                action: null,
                mobileOnly: true
            },
            {
                element: '.message-input',
                title: '✍️ Send Messages',
                content: 'Type your message here and press Enter or click the send button.',
                position: 'top',
                action: null
            },
            {
                element: '.input-button:first-child',
                title: '😊 Add Emojis',
                content: 'Click to add emojis to your messages and express yourself!',
                position: 'top',
                action: null
            },
            {
                element: '.input-button:nth-child(3)',
                title: '📎 Share Files',
                content: 'Upload images, documents, and other files to share in chat.',
                position: 'top',
                action: null
            },
            {
                element: '.input-button:nth-child(4)',
                title: '🎤 Voice Messages',
                content: 'Record and send voice messages for quick communication.',
                position: 'top',
                action: null
            }
        ];
    }

    // Check if user has completed tutorial
    hasCompletedTutorial() {
        return localStorage.getItem('tutorial_completed') === 'true';
    }

    // Mark tutorial as completed
    markTutorialCompleted() {
        localStorage.setItem('tutorial_completed', 'true');
    }

    // Start the tutorial
    start() {
        if (this.isActive || this.hasCompletedTutorial()) {
            return;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.showOverlay();
        this.showCurrentStep();
    }

    // Show overlay
    showOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.innerHTML = `
            <style>
                #tutorial-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 10000;
                    pointer-events: none;
                    backdrop-filter: blur(1px);
                }
                
                .tutorial-highlight {
                    position: relative;
                    z-index: 10001;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
                    border: 3px solid #25d366;
                    border-radius: 8px;
                    pointer-events: auto;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 3px #25d366;
                    }
                    50% {
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 6px #25d366;
                    }
                    100% {
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 3px #25d366;
                    }
                }
                
                .tutorial-tooltip {
                    position: absolute;
                    background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 16px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    max-width: 320px;
                    z-index: 10002;
                    pointer-events: auto;
                    animation: slideIn 0.4s ease;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .tutorial-tooltip::before {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 0;
                    border: 12px solid transparent;
                }
                
                .tutorial-tooltip.top::before {
                    bottom: -24px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-top-color: #25d366;
                }
                
                .tutorial-tooltip.bottom::before {
                    top: -24px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-bottom-color: #25d366;
                }
                
                .tutorial-tooltip.left::before {
                    right: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-left-color: #25d366;
                }
                
                .tutorial-tooltip.right::before {
                    left: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-right-color: #25d366;
                }
                
                .tutorial-tooltip h3 {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                
                .tutorial-tooltip p {
                    margin: 0 0 16px 0;
                    font-size: 15px;
                    line-height: 1.5;
                    color: rgba(255, 255, 255, 0.95);
                    font-weight: 400;
                }
                
                .tutorial-tooltip .tutorial-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    align-items: center;
                }
                
                .tutorial-tooltip button {
                    padding: 10px 18px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                
                .tutorial-btn-skip {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    backdrop-filter: blur(10px);
                }
                
                .tutorial-btn-skip:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }
                
                .tutorial-btn-next {
                    background: white;
                    color: #25d366;
                    font-weight: 600;
                }
                
                .tutorial-btn-next:hover {
                    background: #f0f0f0;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .tutorial-btn-done {
                    background: white;
                    color: #25d366;
                    font-weight: 600;
                }
                
                .tutorial-btn-done:hover {
                    background: #f0f0f0;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .tutorial-progress {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 12px;
                    font-weight: 500;
                }
                
                .tutorial-progress-number {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                }
                
                /* Mobile adjustments */
                @media (max-width: 768px) {
                    #tutorial-overlay {
                        background: rgba(0, 0, 0, 0.5);
                    }
                    
                    .tutorial-tooltip {
                        max-width: 280px;
                        padding: 16px;
                        margin: 0 16px;
                        font-size: 14px;
                    }
                    
                    .tutorial-tooltip h3 {
                        font-size: 16px;
                        margin-bottom: 10px;
                    }
                    
                    .tutorial-tooltip p {
                        font-size: 14px;
                        line-height: 1.4;
                        margin-bottom: 14px;
                    }
                    
                    .tutorial-tooltip .tutorial-buttons {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .tutorial-tooltip button {
                        width: 100%;
                        padding: 12px 16px;
                        font-size: 15px;
                        font-weight: 600;
                        border-radius: 10px;
                        min-height: 44px; /* Touch target size */
                    }
                    
                    .tutorial-btn-skip {
                        order: 2;
                        background: rgba(255, 255, 255, 0.15);
                    }
                    
                    .tutorial-btn-next, .tutorial-btn-done {
                        order: 1;
                        background: white;
                        color: #25d366;
                    }
                    
                    .tutorial-progress {
                        font-size: 12px;
                        margin-bottom: 10px;
                        text-align: center;
                    }
                    
                    .tutorial-progress-number {
                        background: rgba(255, 255, 255, 0.25);
                        padding: 4px 10px;
                        border-radius: 15px;
                        font-weight: 600;
                    }
                    
                    /* Adjust highlight for mobile */
                    .tutorial-highlight {
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
                        border: 4px solid #25d366; /* Thicker border for visibility */
                    }
                    
                    @keyframes pulse {
                        0% {
                            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px #25d366;
                        }
                        50% {
                            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 8px #25d366;
                        }
                        100% {
                            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px #25d366;
                        }
                    }
                    
                    /* Adjust tooltip positioning for mobile */
                    .tutorial-tooltip.top::before {
                        border-top-color: #25d366;
                        border-width: 16px;
                    }
                    
                    .tutorial-tooltip.bottom::before {
                        border-bottom-color: #25d366;
                        border-width: 16px;
                    }
                    
                    .tutorial-tooltip.left::before {
                        border-left-color: #25d366;
                        border-width: 16px;
                    }
                    
                    .tutorial-tooltip.right::before {
                        border-right-color: #25d366;
                        border-width: 16px;
                    }
                }
                
                /* Small mobile phones */
                @media (max-width: 480px) {
                    .tutorial-tooltip {
                        max-width: 260px;
                        padding: 14px;
                        margin: 0 12px;
                    }
                    
                    .tutorial-tooltip h3 {
                        font-size: 15px;
                    }
                    
                    .tutorial-tooltip p {
                        font-size: 13px;
                    }
                    
                    .tutorial-tooltip button {
                        font-size: 14px;
                        padding: 10px 14px;
                        min-height: 40px;
                    }
                }
                
                /* Very small mobile */
                @media (max-width: 360px) {
                    .tutorial-tooltip {
                        max-width: 240px;
                        padding: 12px;
                        margin: 0 8px;
                    }
                    
                    .tutorial-tooltip h3 {
                        font-size: 14px;
                    }
                    
                    .tutorial-tooltip p {
                        font-size: 12px;
                    }
                    
                    .tutorial-tooltip button {
                        font-size: 13px;
                        padding: 8px 12px;
                        min-height: 36px;
                    }
                }
                
                /* High contrast for better visibility */
                @media (prefers-contrast: high) {
                    .tutorial-tooltip {
                        background: #000;
                        border: 2px solid #25d366;
                    }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    // Show current step
    showCurrentStep() {
        const step = this.tourSteps[this.currentStep];
        
        // Skip mobile-only steps on desktop
        if (step.mobileOnly && window.innerWidth > 768) {
            this.nextStep();
            return;
        }

        const element = document.querySelector(step.element);
        if (!element) {
            this.nextStep();
            return;
        }

        // Remove previous highlights and tooltips
        this.clearCurrentStep();

        // Highlight current element
        element.classList.add('tutorial-highlight');

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = `tutorial-tooltip ${step.position}`;
        tooltip.innerHTML = `
            <div class="tutorial-progress">Step <span class="tutorial-progress-number">${this.currentStep + 1}</span> of ${this.tourSteps.length}</div>
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="tutorial-buttons">
                ${this.currentStep > 0 ? '<button class="tutorial-btn-skip" onclick="tutorialTour.previousStep()">← Back</button>' : '<button class="tutorial-btn-skip" onclick="tutorialTour.skipTour()">Skip Tour</button>'}
                ${this.currentStep < this.tourSteps.length - 1 ? '<button class="tutorial-btn-next" onclick="tutorialTour.nextStep()">Next →</button>' : '<button class="tutorial-btn-done" onclick="tutorialTour.completeTour()">🎉 Get Started!</button>'}
            </div>
        `;

        // Position tooltip
        this.positionTooltip(tooltip, element, step.position);

        document.getElementById('tutorial-overlay').appendChild(tooltip);

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Position tooltip
    positionTooltip(tooltip, element, position) {
        const rect = element.getBoundingClientRect();
        const overlayRect = document.getElementById('tutorial-overlay').getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        
        // Calculate initial position
        let top, left;
        
        // For mobile, prefer center positioning with better margins
        if (isMobile) {
            switch (position) {
                case 'top':
                    top = (rect.top - overlayRect.top - tooltip.offsetHeight - 20);
                    left = 16; // Fixed left margin for mobile
                    break;
                case 'bottom':
                    top = (rect.bottom - overlayRect.top + 20);
                    left = 16; // Fixed left margin for mobile
                    break;
                case 'left':
                    top = (rect.top - overlayRect.top + rect.height / 2 - tooltip.offsetHeight / 2);
                    left = 16; // Fixed left margin for mobile
                    break;
                case 'right':
                    top = (rect.top - overlayRect.top + rect.height / 2 - tooltip.offsetHeight / 2);
                    left = (overlayRect.width - tooltip.offsetWidth - 16); // Fixed right margin for mobile
                    break;
            }
        } else {
            // Desktop positioning
            switch (position) {
                case 'top':
                    top = (rect.top - overlayRect.top - tooltip.offsetHeight - 20);
                    left = (rect.left - overlayRect.left + rect.width / 2 - tooltip.offsetWidth / 2);
                    break;
                case 'bottom':
                    top = (rect.bottom - overlayRect.top + 20);
                    left = (rect.left - overlayRect.left + rect.width / 2 - tooltip.offsetWidth / 2);
                    break;
                case 'left':
                    top = (rect.top - overlayRect.top + rect.height / 2 - tooltip.offsetHeight / 2);
                    left = (rect.left - overlayRect.left - tooltip.offsetWidth - 20);
                    break;
                case 'right':
                    top = (rect.top - overlayRect.top + rect.height / 2 - tooltip.offsetHeight / 2);
                    left = (rect.right - overlayRect.left + 20);
                    break;
            }
        }

        // Apply initial position
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';

        // Adjust if tooltip goes off screen with better logic
        this.adjustTooltipPosition(tooltip, overlayRect, rect, position, isMobile);
    }

    // Adjust tooltip position if it goes off screen
    adjustTooltipPosition(tooltip, overlayRect, elementRect, originalPosition, isMobile = false) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = isMobile ? 16 : 20;
        const arrowSize = isMobile ? 16 : 12;

        // Adjust horizontal position
        if (tooltipRect.left < margin) {
            tooltip.style.left = margin + 'px';
        }
        if (tooltipRect.right > overlayRect.width - margin) {
            tooltip.style.left = (overlayRect.width - tooltip.offsetWidth - margin) + 'px';
        }

        // Adjust vertical position
        if (tooltipRect.top < margin) {
            // Try to position below instead
            if (originalPosition === 'top') {
                tooltip.style.top = (elementRect.bottom - overlayRect.top + margin + arrowSize) + 'px';
                tooltip.className = tooltip.className.replace('top', 'bottom');
            } else {
                tooltip.style.top = margin + 'px';
            }
        }
        if (tooltipRect.bottom > overlayRect.height - margin) {
            // Try to position above instead
            if (originalPosition === 'bottom') {
                tooltip.style.top = (elementRect.top - overlayRect.top - tooltip.offsetHeight - margin - arrowSize) + 'px';
                tooltip.className = tooltip.className.replace('bottom', 'top');
            } else {
                tooltip.style.top = (overlayRect.height - tooltip.offsetHeight - margin) + 'px';
            }
        }

        // Final check - if still off screen, center it (mobile优先)
        const finalRect = tooltip.getBoundingClientRect();
        if (finalRect.left < margin || finalRect.right > overlayRect.width - margin) {
            if (isMobile) {
                // On mobile, always align to left with proper margin
                tooltip.style.left = margin + 'px';
            } else {
                tooltip.style.left = (overlayRect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            }
        }
        if (finalRect.top < margin || finalRect.bottom > overlayRect.height - margin) {
            if (isMobile) {
                // On mobile, position in center vertically if needed
                tooltip.style.top = (overlayRect.height / 2 - tooltip.offsetHeight / 2) + 'px';
            } else {
                tooltip.style.top = (overlayRect.height / 2 - tooltip.offsetHeight / 2) + 'px';
            }
        }
    }

    // Clear current step
    clearCurrentStep() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        document.querySelectorAll('.tutorial-tooltip').forEach(el => {
            el.remove();
        });
    }

    // Next step
    nextStep() {
        if (this.currentStep < this.tourSteps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.completeTour();
        }
    }

    // Previous step
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    // Skip tour
    skipTour() {
        if (confirm('Are you sure you want to skip the tutorial? You can always restart it from your profile.')) {
            this.completeTour();
        }
    }

    // Complete tour
    completeTour() {
        this.isActive = false;
        this.markTutorialCompleted();
        this.removeOverlay();
        
        // Show completion message
        setTimeout(() => {
            this.showCompletionMessage();
        }, 300);
    }

    // Remove overlay
    removeOverlay() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Show completion message
    showCompletionMessage() {
        const isMobile = window.innerWidth <= 768;
        const message = document.createElement('div');
        
        // Mobile-optimized styling
        const mobileStyles = isMobile ? `
            width: 90%;
            max-width: 320px;
            padding: 20px;
            margin: 0 16px;
            font-size: 16px;
        ` : `
            max-width: 400px;
            padding: 24px 32px;
            font-size: 18px;
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            color: white;
            border-radius: 16px;
            box-shadow: 0 16px 48px rgba(37, 211, 102, 0.4);
            z-index: 10003;
            text-align: center;
            animation: celebrationIn 0.5s ease;
            font-weight: 600;
            ${mobileStyles}
        `;
        
        const emojiSize = isMobile ? '36px' : '48px';
        const titleSize = isMobile ? '16px' : '18px';
        const subtitleSize = isMobile ? '12px' : '14px';
        
        message.innerHTML = `
            <div style="font-size: ${emojiSize}; margin-bottom: ${isMobile ? '12px' : '16px'};">🎉</div>
            <div style="font-size: ${titleSize}; margin-bottom: 8px;">Tutorial Completed!</div>
            <div style="font-size: ${subtitleSize}; font-weight: 400; opacity: 0.9;">You're ready to start chatting like a pro!</div>
        `;
        document.body.appendChild(message);

        // Add celebration animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebrationIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            @keyframes celebrationOut {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            message.style.animation = 'celebrationOut 0.5s ease';
            setTimeout(() => {
                message.remove();
                style.remove();
            }, 500);
        }, 3000);
    }
}

// Create global instance
const tutorialTour = new TutorialTour();

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
