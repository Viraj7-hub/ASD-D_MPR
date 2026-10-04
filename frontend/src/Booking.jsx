// Booking.jsx — FIX #3: Real DB persistence, FIX #14: Real slot availability, FIX #16: Toast instead of alert
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, Clock, Wrench, Upload, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useToast } from './Toast.jsx';
import './Booking.css';

// ── Helper: Get days in a month ──
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// ── Helper: Get the day-of-week the 1st falls on (0=Sun, 6=Sat) ──
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// ── Helper: Month names ──
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ── All available time slots ──
const MORNING_SLOTS = ['08:00 AM', '09:30 AM', '11:00 AM', '11:30 AM'];
const AFTERNOON_SLOTS = ['02:00 PM', '03:30 PM', '05:00 PM'];

// ── Helper: Format selected date ──
function formatSelectedDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
        dayName: days[date.getDay()],
        monthDay: `${months[date.getMonth()]} ${date.getDate()}`
    };
}

// ── Helper: Format date to YYYY-MM-DD for the API ──
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function Booking() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const providerData = location.state?.providerData;
    const fileInputRef = useRef(null);

    // ── Calendar State ──
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today);

    // ── Time Slot State ──
    const [selectedSlot, setSelectedSlot] = useState('');
    // FIX #14: Unavailable slots fetched from DB, not hardcoded
    const [unavailableSlots, setUnavailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // ── Job Details State ──
    const [jobDescription, setJobDescription] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // ── Submission State ──
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null); // { bookingId }

    // ── FIX #14: Fetch real unavailable slots whenever date or provider changes ──
    useEffect(() => {
        if (!providerData?.Email || !selectedDate) return;
        const fetchSlots = async () => {
            setSlotsLoading(true);
            try {
                const dateStr = toISODate(selectedDate);
                const res = await fetch(
                    `http://localhost:8009/available_slots?providerEmail=${encodeURIComponent(providerData.Email)}&date=${dateStr}`,
                    { credentials: 'include' }
                );
                if (res.ok) {
                    const data = await res.json();
                    setUnavailableSlots(data.unavailableSlots || []);
                }
            } catch (err) {
                console.error('Failed to fetch slots:', err);
            } finally {
                setSlotsLoading(false);
            }
        };
        fetchSlots();
        // Reset selected slot when date changes
        setSelectedSlot('');
    }, [selectedDate, providerData?.Email]);

    // ── Calendar Navigation ──
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // ── Date Selection ──
    const handleDateClick = (day) => {
        const clicked = new Date(currentYear, currentMonth, day);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (clicked < todayStart) return;
        setSelectedDate(clicked);
    };

    // ── File Upload ──
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            const maxSize = 5 * 1024 * 1024;
            return validTypes.includes(file.type) && file.size <= maxSize;
        });
        setUploadedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // ── FIX #3: Real booking submission to backend ──
    const handleSubmit = async () => {
        if (!selectedDate || !selectedSlot) {
            showToast('Please select a date and time slot.', 'warning');
            return;
        }
        if (!jobDescription.trim()) {
            showToast('Please describe your problem.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:8009/booking', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerEmail: providerData.Email,
                    serviceType: providerData.serviceType,
                    bookingDate: toISODate(selectedDate),
                    timeSlot: selectedSlot,
                    description: jobDescription,
                })
            });

            const data = await res.json();

            if (res.ok) {
                setBookingSuccess({ bookingId: data.bookingId });
                showToast('Booking confirmed! Redirecting to your requests…', 'success', 4000);
                setTimeout(() => navigate('/my_requests'), 4000);
            } else {
                showToast(data.message || 'Booking failed. Please try again.', 'error');
            }
        } catch (err) {
            showToast('Network error. Please check your connection.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Build Calendar Grid ──
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    const calendarCells = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        calendarCells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({ day: d, isCurrentMonth: true });
    }
    const remaining = 7 - (calendarCells.length % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            calendarCells.push({ day: i, isCurrentMonth: false });
        }
    }

    const formattedDate = formatSelectedDate(selectedDate);

    const isToday = (day) => {
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    const isSelected = (day) => {
        return day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear();
    };

    const isPast = (day) => {
        const date = new Date(currentYear, currentMonth, day);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return date < todayStart;
    };

    // ── Success Screen ──
    if (bookingSuccess) {
        return (
            <div className="booking-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', textAlign: 'center' }}>
                <CheckCircle2 size={64} color="#059669" />
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#065f46', margin: 0 }}>Booking Confirmed!</h2>
                <p style={{ color: '#475569', margin: 0 }}>
                    Booking ID: <strong>#PRFX-{String(bookingSuccess.bookingId).padStart(4, '0')}</strong>
                </p>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Redirecting to My Requests…
                </p>
            </div>
        );
    }

    return (
        <div className="booking-page">
            {/* Back Button */}
            <button className="booking-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Provider Info (if available) */}
            {providerData && (
                <div className="booking-provider-info">
                    <span>Booking for: <strong>{providerData.UserName}</strong></span>
                    <span className="provider-service-tag">{providerData.serviceType}</span>
                </div>
            )}

            {/* ═══════════════════ SECTION 1: Select a Date ═══════════════════ */}
            <section className="booking-section">
                <h2 className="section-heading">
                    <CalendarDays size={18} />
                    1. Select a Date
                </h2>

                <div className="date-picker-layout">
                    {/* Calendar */}
                    <div className="calendar-container">
                        {/* Month Navigation */}
                        <div className="calendar-nav">
                            <span className="calendar-month-label">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                            </span>
                            <div className="calendar-nav-btns">
                                <button className="cal-nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
                                    <ChevronLeft size={16} />
                                </button>
                                <button className="cal-nav-btn" onClick={handleNextMonth} aria-label="Next month">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Day Labels */}
                        <div className="calendar-grid">
                            {DAY_LABELS.map(label => (
                                <div key={label} className="calendar-day-label">{label}</div>
                            ))}

                            {/* Calendar Days */}
                            {calendarCells.map((cell, idx) => {
                                if (!cell.isCurrentMonth) {
                                    return (
                                        <div key={`empty-${idx}`} className="calendar-day other-month">
                                            {cell.day}
                                        </div>
                                    );
                                }

                                const selected = isSelected(cell.day);
                                const past = isPast(cell.day);
                                const todayMark = isToday(cell.day);

                                return (
                                    <button
                                        key={`day-${cell.day}`}
                                        className={`calendar-day 
                      ${selected ? 'selected' : ''} 
                      ${past ? 'past' : ''} 
                      ${todayMark && !selected ? 'today' : ''}`}
                                        onClick={() => !past && handleDateClick(cell.day)}
                                        disabled={past}
                                    >
                                        {cell.day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Date Display */}
                    <div className="selected-date-display">
                        <span className="selected-date-label">Selected Date</span>
                        <h3 className="selected-date-value">
                            {formattedDate.dayName}, {formattedDate.monthDay}
                        </h3>
                        <span className="availability-badge">
                            <span className="availability-dot"></span>
                            {slotsLoading ? 'Checking availability…' : 'Availability Loaded'}
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════ SECTION 2: Preferred Time Slot ═══════════════════ */}
            <section className="booking-section">
                <h2 className="section-heading">
                    <Clock size={18} />
                    2. Preferred Time Slot
                </h2>

                {slotsLoading ? (
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Loading available slots…</p>
                ) : (
                    <>
                        {/* Morning Slots */}
                        <div className="time-slot-group">
                            <span className="time-slot-period">Morning</span>
                            <div className="time-slot-row">
                                {MORNING_SLOTS.map(slot => {
                                    const unavailable = unavailableSlots.includes(slot);
                                    const active = selectedSlot === slot;
                                    return (
                                        <button
                                            key={slot}
                                            className={`time-slot-btn ${active ? 'active' : ''} ${unavailable ? 'unavailable' : ''}`}
                                            onClick={() => !unavailable && setSelectedSlot(slot)}
                                            disabled={unavailable}
                                            title={unavailable ? 'This slot is already booked' : ''}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Afternoon Slots */}
                        <div className="time-slot-group">
                            <span className="time-slot-period">Afternoon</span>
                            <div className="time-slot-row">
                                {AFTERNOON_SLOTS.map(slot => {
                                    const unavailable = unavailableSlots.includes(slot);
                                    const active = selectedSlot === slot;
                                    return (
                                        <button
                                            key={slot}
                                            className={`time-slot-btn ${active ? 'active' : ''} ${unavailable ? 'unavailable' : ''}`}
                                            onClick={() => !unavailable && setSelectedSlot(slot)}
                                            disabled={unavailable}
                                            title={unavailable ? 'This slot is already booked' : ''}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ═══════════════════ SECTION 3: Job Details ═══════════════════ */}
            <section className="booking-section">
                <h2 className="section-heading">
                    <Wrench size={18} />
                    3. Job Details
                </h2>

                <div className="job-details-group">
                    <label className="job-label">Describe your problem</label>
                    <textarea
                        className="job-textarea"
                        rows={4}
                        placeholder="Example: The kitchen sink pipe is leaking at the joint. Water is dripping slowly even when the tap is off..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>

                {/* File Upload Area */}
                <div
                    className="file-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={24} className="upload-icon" />
                    <span className="upload-title">Upload photos for a better estimate</span>
                    <span className="upload-subtitle">Max size 5MB. PNG, JPG formats only.</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        multiple
                        hidden
                        onChange={handleFileUpload}
                    />
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                    <div className="uploaded-files-list">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="uploaded-file-item">
                                <span className="file-name">{file.name}</span>
                                <button className="remove-file-btn" onClick={() => removeFile(index)}>✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <button
                className="booking-submit-btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
                {isSubmitting ? 'Confirming…' : 'Confirm Booking'}
            </button>
        </div>
    );
}
