// Chat.jsx — FIX #6: Lock/Propose price buttons, FIX #7: Real online status,
//             FIX #8: Stable service ID, FIX #15: navigate(-1) back button, FIX #16: Toast
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useToast } from './Toast.jsx';
import './Chat.css';

// ─── Socket initialisation — created once for the entire session ──────────────
const socket = io("http://localhost:8009", {
    withCredentials: true
});

export default function Chat() {
    const location = useLocation();
    const [selectedProvider, setSelectedProvider] = useState(location.state?.providerData || null);

    if (!selectedProvider) {
        return <ChatsList onSelect={setSelectedProvider} />;
    }

    return <ChatView provider={selectedProvider} onBack={() => setSelectedProvider(null)} />;
}

function ChatsList({ onSelect }) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await fetch('http://localhost:8009/my_chats', { credentials: 'include' });
                if (!res.ok) throw new Error("Failed to fetch chats");
                const data = await res.json();
                setChats(data.chats || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    return (
        <div className="chat-layout">
            <div className="chat-sidebar" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', flex: 'none', height: '100vh', padding: '20px' }}>
                <div className="sidebar-header" style={{ marginBottom: '20px' }}>
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h3>My Chats</h3>
                </div>
                {loading ? (
                    <div className="chat-loading">Loading conversations...</div>
                ) : chats.length === 0 ? (
                    <div className="chat-empty-state" style={{ marginTop: '40px' }}>
                        <span>💬</span>
                        <p>No active chats found.</p>
                    </div>
                ) : (
                    chats.map((c, i) => (
                        <div key={i} className="sidebar-contact active" style={{ cursor: 'pointer', marginBottom: '10px', padding: '15px' }} onClick={() => onSelect({
                            Email: c.otherEmail,
                            UserName: c.name,
                            City: c.city,
                            serviceType: c.serviceType,
                            Experience: c.experience
                        })}>
                            <div className="contact-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                            <div className="contact-info" style={{ flex: 1, marginLeft: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px' }}>{c.name}</h4>
                                <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.lastMessage}
                                </p>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {new Date(c.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ChatView({ provider, onBack }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // ── State ──────────────────────────────────────────────────────────────────
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [myEmail, setMyEmail] = useState("");
    const [myRole, setMyRole] = useState("");  // Track if current user is 'User' or 'Service Provider'
    const [isLoading, setIsLoading] = useState(true);
    // FIX #7: Real online status tracked via socket events
    const [isProviderOnline, setIsProviderOnline] = useState(false);
    // FIX #6: Propose price UI state
    const [showProposeInput, setShowProposeInput] = useState(false);
    const [proposedPrice, setProposedPrice] = useState('');
    // FIX #6: Locked price state (agreed price)
    const [lockedPrice, setLockedPrice] = useState(null);
    // Payment flow states
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    const messagesEndRef = useRef(null);

    // FIX #8: Stable service ID — computed once via useRef, never regenerates
    const serviceIdRef = useRef(
        'PRFX-' + Math.random().toString(36).substring(2, 7).toUpperCase()
    );

    // ── Derived value: unique room name ───────────────────────────────────────
    const roomName = useMemo(() => {
        return myEmail && provider
            ? [myEmail, provider.Email].sort().join("_")
            : "";
    }, [myEmail, provider]);

    // ── Effect 1: Fetch the logged-in user's email on mount ──────────────────
    // Uses /session-check instead of /user_profile so both Users AND Service Providers work
    useEffect(() => {
        const fetchMyProfile = async () => {
            try {
                const response = await fetch('http://localhost:8009/session-check', {
                    credentials: 'include'
                });
                if (!response.ok) {
                    console.warn("Not logged in — chat features disabled.");
                    setIsLoading(false);
                    return;
                }
                const data = await response.json();
                setMyEmail(data.email);
                setMyRole(data.role || '');
                // FIX #7: Register this user as online with their email
                socket.emit("register_user", data.email);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                setIsLoading(false);
            }
        };
        fetchMyProfile();
    }, []);

    // ── Effect 2: Join the socket room + load chat history ───────────────────
    useEffect(() => {
        if (!myEmail || !provider) return;

        socket.emit("join_room", roomName);

        const fetchHistory = async () => {
            try {
                const res = await fetch(
                    `http://localhost:8009/chat_history?user1=${myEmail}&user2=${provider.Email}`,
                    { credentials: 'include' }
                );
                const history = await res.json();
                const formatted = history.map(row => ({
                    room: roomName,
                    senderEmail: row.senderEmail,
                    receiverEmail: row.receiverEmail,
                    message: row.message,
                    timestamp: new Date(row.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }));
                setMessageList(formatted);
            } catch (error) {
                console.error("Failed to load chat history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [myEmail, provider, roomName]);

    // ── Effect 3: Listen for incoming messages ────────────────────────────────
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setMessageList((prev) => [...prev, data]);
            // Auto-detect price lock from the other party
            if (data.message && data.message.startsWith('✅ [PRICE LOCKED]')) {
                const priceMatch = data.message.match(/₹(\d+)/);
                if (priceMatch) {
                    setLockedPrice(priceMatch[1]);
                }
            }
        };
        socket.on("receive_message", handleReceiveMessage);
        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, []);

    // ── FIX #7: Listen for provider online/offline events ────────────────────
    useEffect(() => {
        if (!provider) return;

        const handleOnline = ({ email }) => {
            if (email === provider.Email) setIsProviderOnline(true);
        };
        const handleOffline = ({ email }) => {
            if (email === provider.Email) setIsProviderOnline(false);
        };

        socket.on("user_online", handleOnline);
        socket.on("user_offline", handleOffline);

        return () => {
            socket.off("user_online", handleOnline);
            socket.off("user_offline", handleOffline);
        };
    }, [provider]);

    // ── Effect 4: Auto-scroll to the latest message ──────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageList]);

    // ── sendMessage ──────────────────────────────────────────────────────────
    const sendMessage = (overrideText) => {
        const text = overrideText || currentMessage;
        if (text.trim() === "") return;

        const messageData = {
            room: roomName,
            senderEmail: myEmail,
            receiverEmail: provider.Email,
            message: text,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        socket.emit("send_message", messageData);
        setMessageList((prev) => [...prev, messageData]);
        setCurrentMessage("");
    };

    // ── FIX #6: Propose new price ─────────────────────────────────────────────
    const handleProposePrice = () => {
        if (!proposedPrice.trim()) {
            showToast('Please enter a price to propose.', 'warning');
            return;
        }
        const offerMsg = `💬 [PRICE OFFER] ₹${proposedPrice}`;
        sendMessage(offerMsg);
        setProposedPrice('');
        setShowProposeInput(false);
        showToast(`Price offer of ₹${proposedPrice} sent to ${provider.UserName}.`, 'info');
    };

    // ── FIX #6: Lock price + Razorpay payment flow ─────────────────────────────
    const handleLockPrice = async () => {
        // Prevent double-click while payment is in progress
        if (paymentProcessing || paymentCompleted) return;

        // 1. Find the latest proposed price from messages
        let price = lockedPrice;
        if (!price) {
            for (let i = messageList.length - 1; i >= 0; i--) {
                const msg = messageList[i].message;
                if (msg && msg.startsWith('💬 [PRICE OFFER]')) {
                    const match = msg.match(/₹(\d+)/);
                    if (match) {
                        price = match[1];
                        break;
                    }
                }
            }
        }
        if (!price) {
            showToast('No price to lock. Please propose a price first.', 'warning');
            return;
        }

        const amountInPaise = Number(price) * 100;
        setPaymentProcessing(true);

        try {
            // 2. Create a Razorpay order on the backend
            const orderRes = await fetch('http://localhost:8009/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: amountInPaise,
                    providerEmail: provider.Email,
                    serviceType: provider.serviceType || 'General'
                })
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                showToast(orderData.message || 'Failed to create payment order.', 'error');
                setPaymentProcessing(false);
                return;
            }

            // 3. Open Razorpay Checkout modal
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'ProFix',
                description: `${provider.serviceType || 'Service'} — Payment to ${provider.UserName}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 4. Payment succeeded on Razorpay's end → verify on our server
                    try {
                        const verifyRes = await fetch('http://localhost:8009/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // 5. Payment verified — send locked message in chat
                            const lockMsg = `✅ [PRICE LOCKED] Payment of ₹${price} completed successfully. Order ID: ${response.razorpay_order_id}`;
                            sendMessage(lockMsg);
                            setLockedPrice(price);
                            setPaymentCompleted(true);
                            showToast(`Payment of ₹${price} successful! Price locked.`, 'success');
                        } else {
                            showToast(verifyData.message || 'Payment verification failed.', 'error');
                        }
                    } catch (verifyErr) {
                        console.error('Payment verification error:', verifyErr);
                        showToast('Payment verification failed. Please contact support.', 'error');
                    } finally {
                        setPaymentProcessing(false);
                    }
                },
                prefill: {
                    email: myEmail
                },
                theme: {
                    color: '#0c3396'
                },
                modal: {
                    ondismiss: function () {
                        setPaymentProcessing(false);
                        showToast('Payment cancelled. You can try again when ready.', 'warning');
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            // Handle payment failure events from Razorpay
            rzp.on('payment.failed', function (response) {
                setPaymentProcessing(false);
                showToast(
                    `Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`,
                    'error'
                );
                console.error('Razorpay payment failed:', response.error);
            });

            rzp.open();

        } catch (error) {
            console.error('Payment flow error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            setPaymentProcessing(false);
        }
    };

    // Provider is guaranteed to be present from the wrapper component

    return (
        <div className="chat-layout">

            {/* ── LEFT COLUMN: Sidebar ──────────────────────────────────────── */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    {/* FIX #15: Use onBack to return to chat list */}
                    <button className="back-btn" onClick={onBack}>
                        ← Back
                    </button>
                    <h3>Active Chat</h3>
                </div>

                <div className="sidebar-contact active">
                    <div className="contact-avatar">
                        {provider.UserName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info">
                        <h4>{provider.UserName}</h4>
                        {/* FIX #7: Dynamic online status */}
                        <p className={`online-indicator ${isProviderOnline ? 'online' : 'offline'}`}>
                            {isProviderOnline ? '● Online' : '○ Offline'}
                        </p>
                    </div>
                </div>

                <div className="sidebar-provider-info">
                    <p><span>🔧</span> {provider.serviceType || 'Service Provider'}</p>
                    <p><span>📍</span> {provider.City}</p>
                    <p><span>💼</span> {provider.Experience} exp.</p>
                </div>
            </div>

            {/* ── MIDDLE COLUMN: Chat window ────────────────────────────────── */}
            <div className="chat-main">

                <div className="chat-header">
                    <div className="chat-header-avatar">
                        {provider.UserName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2>{provider.UserName}</h2>
                        <p className="chat-header-sub">
                            Verified {provider.serviceType} · {provider.City}
                        </p>
                    </div>
                    {/* FIX #7: Status badge reflects real status */}
                    <span className={`status-badge ${isProviderOnline ? 'status-online' : 'status-offline'}`}>
                        {isProviderOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>

                <div className="chat-messages">
                    {isLoading ? (
                        <div className="chat-loading">Loading messages...</div>
                    ) : messageList.length === 0 ? (
                        <div className="chat-empty-state">
                            <span>👋</span>
                            <p>No messages yet. Say hello to start negotiating!</p>
                        </div>
                    ) : (
                        messageList.map((msg, index) => {
                            const isMe = msg.senderEmail === myEmail;
                            // Detect special message types for styled rendering
                            const isOffer = msg.message.startsWith('💬 [PRICE OFFER]');
                            const isLocked = msg.message.startsWith('✅ [PRICE LOCKED]');
                            return (
                                <div
                                    key={index}
                                    className={`message-bubble ${isMe ? 'my-message' : 'their-message'} ${isOffer ? 'offer-bubble' : ''} ${isLocked ? 'locked-bubble' : ''}`}
                                >
                                    <div className="message-content">
                                        <p>{msg.message}</p>
                                    </div>
                                    <span className="message-time">{msg.timestamp}</span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        value={currentMessage}
                        placeholder="Type your message here..."
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        onClick={() => sendMessage()}
                        className="send-button"
                        disabled={currentMessage.trim() === ""}
                    >
                        Send ➤
                    </button>
                </div>
            </div>

            {/* ── RIGHT COLUMN: Negotiation + Job Details ───────────────────── */}
            <div className="chat-details-panel">

                {/* Negotiation summary card */}
                <div className="panel-card">
                    <h3>NEGOTIATION SUMMARY</h3>
                    <div className="price-display">
                        <span>Listed Price</span>
                        <span className="price-bold">₹{provider.price || '—'}</span>
                    </div>
                    {lockedPrice && (
                        <div className="price-display" style={{ marginTop: '8px' }}>
                            <span>Agreed Price</span>
                            <span className="price-bold" style={{ color: '#059669' }}>₹{lockedPrice}</span>
                        </div>
                    )}

                    {/* FIX #6: Lock & Confirm Price — now with Razorpay payment */}
                    <button
                        className={`lock-price-btn ${paymentProcessing ? 'lock-price-processing' : ''} ${paymentCompleted ? 'lock-price-completed' : ''}`}
                        onClick={handleLockPrice}
                        disabled={paymentProcessing || paymentCompleted}
                    >
                        {paymentProcessing ? (
                            <><span className="btn-spinner"></span> Processing Payment...</>
                        ) : paymentCompleted ? (
                            '✅ Paid Successfully'
                        ) : (
                            '🔒 Lock Price & Pay'
                        )}
                    </button>

                    {/* FIX #6: Propose New Price — toggles input field */}
                    <button
                        className="propose-btn"
                        onClick={() => setShowProposeInput(prev => !prev)}
                    >
                        💬 Propose New Price
                    </button>

                    {/* Propose Price Input — shown when button is clicked */}
                    {showProposeInput && (
                        <div className="propose-input-wrapper" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, marginRight: '4px' }}>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={proposedPrice}
                                    onChange={(e) => setProposedPrice(e.target.value)}
                                    placeholder="Enter amount"
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProposePrice()}
                                />
                            </div>
                            <button
                                onClick={handleProposePrice}
                                style={{ padding: '8px 14px', background: '#0c3396', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                            >
                                Send
                            </button>
                        </div>
                    )}
                </div>

                {/* Job details card */}
                <div className="panel-card">
                    <h3>JOB DETAILS</h3>
                    <div className="job-info-card">
                        <h4>{provider.serviceType} Service Request</h4>
                        <p>📍 {provider.City}</p>
                        <p>🔧 {provider.serviceType}</p>
                        {/* FIX #8: Service ID is stable — computed once in useRef */}
                        <p>Service ID: #{serviceIdRef.current}</p>
                    </div>
                </div>

                {/* Provider contact info card */}
                <div className="panel-card">
                    <h3>PROVIDER INFO</h3>
                    <div className="job-info-card">
                        <h4>{provider.UserName}</h4>
                        <p>📧 {provider.Email}</p>
                        <p>💼 {provider.Experience} experience</p>
                    </div>
                </div>
            </div>

        </div>
    );
}