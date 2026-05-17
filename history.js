document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth-guard to load profile
    setTimeout(() => {
        if (!window.currentUser) {
            console.error("User not loaded");
            return;
        }
        loadHistory(window.currentUser.id);
    }, 500);
});

async function loadHistory(userId) {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; color: #00cec9; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 15px;">Loading your interview history...</p></div>';

    try {
        const { data, error } = await window.supabaseClient
            .from('interview_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fa-solid fa-folder-open fa-3x" style="color: #444; margin-bottom: 20px;"></i>
                    <h3>No Interviews Yet</h3>
                    <p style="color: #888; margin-top: 10px; margin-bottom: 20px;">You haven't completed any mock interviews.</p>
                    <a href="interview.html" style="background: #00cec9; color: #0b0c10; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start an Interview</a>
                </div>`;
            return;
        }

        container.innerHTML = '';
        
        data.forEach(session => {
            const date = new Date(session.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const scoreColor = session.score >= 80 ? '#00b894' : session.score >= 60 ? '#fdcb6e' : '#ff7675';

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.03); 
                border: 1px solid rgba(255,255,255,0.06); 
                border-radius: 12px; 
                padding: 20px; 
                margin-bottom: 20px;
                display: flex;
                gap: 20px;
                align-items: center;
                transition: 0.3s;
            `;
            
            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <span style="background: rgba(108, 92, 231, 0.15); color: #a29bfe; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${session.interview_type}</span>
                        <span style="background: rgba(255, 255, 255, 0.1); color: #ccc; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${session.difficulty}</span>
                    </div>
                    <h3 style="margin-bottom: 5px; font-size: 18px;">${session.company}</h3>
                    <p style="color: #888; font-size: 13px;"><i class="fa-regular fa-clock"></i> ${date} &nbsp; | &nbsp; <i class="fa-solid fa-stopwatch"></i> ${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s</p>
                    
                    <div style="margin-top: 15px; font-size: 13px; color: #ccc; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border-left: 3px solid #6c5ce7;">
                        <strong>AI Feedback:</strong> ${session.ai_overall_feedback || 'No feedback generated.'}
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 120px; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 20px;">
                    <div style="font-size: 32px; font-weight: 800; color: ${scoreColor};">${session.score}%</div>
                    <div style="font-size: 11px; color: #888; text-transform: uppercase; margin-top: 5px;">Score</div>
                    <button class="view-transcript-btn" data-id="${session.id}" style="margin-top: 15px; width: 100%; background: transparent; border: 1px solid rgba(0,206,201,0.3); color: #00cec9; padding: 8px 0; border-radius: 6px; font-size: 12px; cursor: pointer; transition: 0.2s;">Transcript</button>
                </div>
            `;
            
            // Store conversation data on the button for easy access
            const btn = card.querySelector('.view-transcript-btn');
            btn.addEventListener('click', () => showTranscript(session));
            
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `<div style="color: #ff7675; padding: 20px;">Error loading history: ${err.message}</div>`;
    }
}

function showTranscript(session) {
    let modal = document.getElementById('transcript-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'transcript-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: 0.3s;
        `;
        document.body.appendChild(modal);
    }

    let transcriptHTML = '';
    const conv = session.conversation || [];
    
    if (conv.length === 0) {
        transcriptHTML = '<p style="color: #888;">No conversation recorded.</p>';
    } else {
        conv.forEach((turn, i) => {
            transcriptHTML += `
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="color: #00cec9; font-size: 13px; font-weight: 600; margin-bottom: 8px;"><i class="fa-solid fa-robot"></i> Q${i+1}: ${turn.question}</div>
                    <div style="color: #fff; font-size: 14px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 8px;">${turn.answer || '<em style="color:#888;">[No answer provided]</em>'}</div>
                </div>
            `;
        });
    }

    modal.innerHTML = `
        <div style="background: #14151a; width: 90%; max-width: 700px; max-height: 85vh; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column;">
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 18px;">Interview Transcript</h2>
                <button id="close-modal" style="background: transparent; border: none; color: #888; font-size: 20px; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding: 20px; overflow-y: auto; flex: 1;">
                ${transcriptHTML}
            </div>
        </div>
    `;

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'all';

    document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    });
}
