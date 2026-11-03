"use client";

import { useState, useRef, useEffect } from "react";
import { createWorker, OEM, PSM } from "tesseract.js";

type ReceiptItem = {
    id: string;
    name: string;
    qty: number;
    price: number;
};

interface ReceiptScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItems: (items: { title: string; price: number; quantity: number }[]) => void;
    isAr?: boolean;
}

// ✅ Default rate — can be overridden by the user in the UI.
const DEFAULT_LBP_TO_USD_RATE = 89500;

export default function ReceiptScanModal({
    isOpen,
    onClose,
    onAddItems,
    isAr = false,
}: ReceiptScanModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);

    const [status, setStatus] = useState<string>("Waiting for image...");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const [rawText, setRawText] = useState<string>("");
    const [items, setItems] = useState<ReceiptItem[]>([]);

    // ✅ NEW: user-editable exchange rate (LBP per 1 USD).
    const [lbpRate, setLbpRate] = useState<string>(String(DEFAULT_LBP_TO_USD_RATE));

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const cancelledRef = useRef<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            resetAll();
            cancelledRef.current = false;
        } else {
            cancelledRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    // -------------------------------------
    // 01 / IMAGE UPLOAD & PREPROCESSING
    // -------------------------------------
    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImageSrc(event.target?.result as string);
                setProcessedCanvas(null);
                setStatus("Image loaded successfully.");
                setErrorMsg("");
                setProgress(0);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    function enhanceImage() {
        if (!imageSrc) {
            setErrorMsg("Upload an image first.");
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const maxWidth = 2400;
            const scale = Math.min(2, maxWidth / img.width);

            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const contrast = 1.4;
            const brightness = 5;

            for (let i = 0; i < data.length; i += 4) {
                let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                gray = (gray - 128) * contrast + 128 + brightness;
                gray = Math.max(0, Math.min(255, gray));
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);
            setProcessedCanvas(canvas);
            setImageSrc(canvas.toDataURL("image/jpeg", 0.95));
            setStatus("Enhanced image ready for OCR.");
            setErrorMsg("");
        };
        img.src = imageSrc;
    }

    function resetAll() {
        setImageSrc(null);
        setProcessedCanvas(null);
        setRawText("");
        setItems([]);
        setProgress(0);
        setStatus("Waiting for image...");
        setErrorMsg("");
        setIsScanning(false);
        // ✅ Reset rate back to the default when the modal is reopened.
        setLbpRate(String(DEFAULT_LBP_TO_USD_RATE));
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }

    // -------------------------------------
    // 02 / OCR RECOGNITION (OVERLAPPING SECTIONS)
    // -------------------------------------
    async function startOCR() {
        if (!imageSrc) {
            setErrorMsg("Please upload a receipt first.");
            return;
        }

        cancelledRef.current = false;
        setIsScanning(true);
        setRawText("");
        setErrorMsg("");
        setProgress(0);
        setStatus("Loading Tesseract engine...");

        let worker: any = null;

        try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = imageSrc;
            });

            const source = processedCanvas || img;
            const canvas = document.createElement("canvas");
            const maxWidth = 2400;
            const scale = Math.min(2, maxWidth / (source.width || img.width));

            canvas.width = Math.round((source.width || img.width) * scale);
            canvas.height = Math.round((source.height || img.height) * scale);

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context initialization failed.");
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

            const sectionCount = 5;
            const overlap = Math.round(canvas.height * 0.025);
            const sectionHeight = Math.ceil(canvas.height / sectionCount);

            worker = await createWorker("eng", OEM.LSTM_ONLY, {
                logger: (m) => {
                    if (cancelledRef.current) return;
                    if (m.status && m.progress !== undefined) {
                        setStatus(`${m.status} ${Math.round(m.progress * 100)}%`);
                    }
                },
            });

            await worker.setParameters({
                tessedit_pageseg_mode: PSM.SPARSE_TEXT,
                preserve_interword_spaces: "1",
            });

            const allSections: { number: number; text: string; confidence: number }[] = [];

            for (let i = 0; i < sectionCount; i++) {
                if (cancelledRef.current) {
                    await worker.terminate();
                    return;
                }

                const top = Math.max(0, i * sectionHeight - overlap);
                const bottom = Math.min(canvas.height, (i + 1) * sectionHeight + overlap);

                const crop = document.createElement("canvas");
                crop.width = canvas.width;
                crop.height = bottom - top;

                const cropCtx = crop.getContext("2d");
                if (cropCtx) {
                    cropCtx.drawImage(
                        canvas,
                        0, top, canvas.width, bottom - top,
                        0, 0, crop.width, crop.height
                    );
                }

                setStatus(`Reading section ${i + 1} of ${sectionCount}...`);
                const result = await worker.recognize(crop);

                allSections.push({
                    number: i + 1,
                    text: result.data.text || "",
                    confidence: result.data.confidence,
                });

                setProgress(Math.round(((i + 1) / sectionCount) * 100));

                const updatedRaw = allSections
                    .map(
                        (s) =>
                            `========== SECTION ${s.number} | CONFIDENCE ${Math.round(s.confidence)}% ==========\n${s.text.trim()}`
                    )
                    .join("\n\n");

                setRawText(updatedRaw);
            }

            if (!cancelledRef.current) {
                setStatus(`OCR completed. All ${sectionCount} sections have been read.`);
                const compiledElement = document.getElementById("receipt-compiled-section");
                if (compiledElement) {
                    compiledElement.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        } catch (error: any) {
            console.error(error);
            if (!cancelledRef.current) {
                setStatus("OCR Error.");
                setErrorMsg("OCR failed: " + (error?.message || String(error)));
            }
        } finally {
            if (worker) {
                try { await worker.terminate(); } catch {}
            }
            if (!cancelledRef.current) setIsScanning(false);
        }
    }

    // -------------------------------------
    // 03 / COMPILE RECEIPT ITEMS
    // -------------------------------------
    function compileReceipt() {
        if (!rawText.trim()) {
            setErrorMsg("No OCR text available.");
            return;
        }

        // ✅ Validate the user-edited rate before compiling.
        const parsedRate = parseFloat(lbpRate);
        if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
            setErrorMsg(isAr
                ? "سعر الصرف غير صالح. أدخل رقماً أكبر من صفر."
                : "Invalid exchange rate. Enter a number greater than zero.");
            return;
        }

        setErrorMsg("");

        const isLBP = /\bL\.?\s?L\.?\b|\bLBP\b|TOTAL\s*LL/i.test(rawText);

        const cleanText = rawText.replace(/^=+\s*SECTION\s+\d+.*?=+\s*$/gim, "");
        const lines = cleanText
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean);

        const parsedItems: ReceiptItem[] = [];
        const seen = new Set<string>();

        for (const line of lines) {
            if (/TOTAL|SUBTOTAL|VAT|TAX|CHECK|TABLE|PHONE|TEL|CHANGE|CASH|BALANCE/i.test(line)) {
                continue;
            }

            let qty = 1;
            let price = NaN;
            let name = "";

            // Pattern A: "2 x Bread 1.20"
            let m = line.match(/^\s*(\d+)\s*[xX]\s+(.+?)\s+([\d,.]+)\s*[A-Z]?\s*$/);
            if (m) {
                qty = parseInt(m[1], 10) || 1;
                name = m[2].trim();
                price = parseFloat(m[3].replace(/,/g, ""));
            }

            // Pattern B: "2 Bread 1.20"
            if (!m) {
                m = line.match(/^\s*(\d+)\s+(.+?)\s+([\d,.]+)\s*[A-Z]?\s*$/);
                if (m) {
                    qty = parseInt(m[1], 10) || 1;
                    name = m[2].trim();
                    price = parseFloat(m[3].replace(/,/g, ""));
                }
            }

            // Pattern C: "Bread 3.00 T 9.00"
            if (!m) {
                const m2 = line.match(/^(.+?)\s+([\d,.]+)\s+[A-Z]\s+([\d,.]+)\s*$/);
                if (m2) {
                    name = m2[1].trim();
                    const first = parseFloat(m2[2].replace(/,/g, ""));
                    const last = parseFloat(m2[3].replace(/,/g, ""));
                    price = last;
                    if (Number.isFinite(first) && first > 0 && Number.isFinite(last)) {
                        const ratio = last / first;
                        if (Math.abs(ratio - Math.round(ratio)) < 0.01 && Math.round(ratio) >= 1 && Math.round(ratio) <= 20) {
                            qty = Math.round(ratio);
                            price = first;
                        }
                    }
                }
            }

            // Pattern D: "Milk 2L 3.50"
            if (!m && !name) {
                const m3 = line.match(/^(.+?)\s+([\d,.]+)\s*[A-Z]?\s*$/);
                if (m3) {
                    name = m3[1].trim();
                    price = parseFloat(m3[2].replace(/,/g, ""));
                    qty = 1;
                }
            }

            if (!name || !Number.isFinite(price) || !Number.isFinite(qty)) continue;
            if (price <= 0 || qty < 1 || qty > 99) continue;
            if (!/[a-zA-Z]{2,}/.test(name)) continue;

            // ✅ Convert using the live rate from the input field.
            if (isLBP) {
                price = parseFloat((price / parsedRate).toFixed(2));
            }

            const key = `${qty}|${name.toLowerCase()}|${price}`;
            if (seen.has(key)) continue;
            seen.add(key);

            parsedItems.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name,
                qty,
                price,
            });
        }

        setItems(parsedItems);

        if (parsedItems.length === 0) {
            setErrorMsg("No items detected. Try enhancing the image or editing the raw text.");
        }

        const compiledElement = document.getElementById("receipt-compiled-section");
        if (compiledElement) {
            compiledElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // -------------------------------------
    // 04 / ITEMS TABLE OPERATIONS
    // -------------------------------------
    function updateItem(index: number, key: "name" | "qty" | "price", val: string) {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                if (key === "name") return { ...item, name: val };
                if (key === "qty") return { ...item, qty: Math.max(1, parseInt(val, 10) || 1) };
                if (key === "price") return { ...item, price: Math.max(0, parseFloat(val) || 0) };
                return item;
            })
        );
    }

    function addItem() {
        setItems((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: isAr ? "صنف جديد" : "New Item",
                qty: 1,
                price: 1.0,
            },
        ]);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function handlePushToCart() {
        if (items.length === 0) return;
        onAddItems(
            items.map((it) => ({
                title: it.name,
                price: it.price,
                quantity: it.qty,
            }))
        );
        onClose();
    }

    return (
        <div
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
            }}
            tabIndex={-1}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#101827",
                    color: "#e8edf5",
                    border: "1px solid #2c3b50",
                    borderRadius: 14,
                    maxWidth: 900,
                    width: "100%",
                    maxHeight: "92vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                    overflow: "hidden",
                    fontFamily: "Arial, sans-serif",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #2c3b50",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, color: "#fff" }}>
                            {isAr ? "استوديو قراءة الفاتورة" : "Receipt OCR Studio"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                            {isAr
                                ? "قراءة الفاتورة واستخراج الأصناف مباشرة إلى السلة"
                                : "Complete receipt recognition & item extraction into cart"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            fontSize: 22,
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
                    <input
                        type="file"
                        id="modalFileInput"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFile}
                    />
                    <input
                        type="file"
                        id="modalCameraInput"
                        ref={cameraInputRef}
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={handleFile}
                    />

                    {errorMsg && (
                        <div
                            style={{
                                background: "#7f1d1d",
                                border: "1px solid #dc4654",
                                color: "#fecaca",
                                padding: "10px 14px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* 01 / IMAGE */}
                    <div style={{ background: "#192538", border: "1px solid #2c3b50", borderRadius: 12, padding: 16 }}>
                        <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#38bdf8" }}>01 / Receipt Image</h3>

                        {!imageSrc ? (
                            <label
                                htmlFor="modalFileInput"
                                style={{
                                    display: "block",
                                    textAlign: "center",
                                    padding: "26px 14px",
                                    border: "2px dashed #526782",
                                    borderRadius: 10,
                                    background: "#142033",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontSize: 32 }}>📄</div>
                                <strong style={{ display: "block", margin: "6px 0 2px" }}>
                                    {isAr ? "اختر صورة الفاتورة" : "Upload your receipt image"}
                                </strong>
                                <span style={{ color: "#94a3b8", fontSize: 11 }}>JPG · PNG · WEBP</span>
                            </label>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    background: "#111827",
                                    borderRadius: 8,
                                    padding: 8,
                                    maxHeight: 280,
                                    overflow: "hidden",
                                }}
                            >
                                <img
                                    src={imageSrc}
                                    alt="Receipt Preview"
                                    style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                style={{ background: "#0284c7", color: "white", padding: "8px 14px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                📷 Camera
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ background: "#334155", color: "white", padding: "8px 14px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={enhanceImage}
                                style={{ background: "#334155", color: "white", padding: "8px 14px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                ✨ Enhance Image
                            </button>
                            <button
                                type="button"
                                onClick={resetAll}
                                style={{ background: "#dc4654", color: "white", padding: "8px 14px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* 02 / OCR RECOGNITION */}
                    <div style={{ background: "#192538", border: "1px solid #2c3b50", borderRadius: 12, padding: 16 }}>
                        <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "#38bdf8" }}>02 / OCR Recognition</h3>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 12px" }}>
                            The receipt is divided into overlapping vertical sections to improve recognition of long receipts.
                        </p>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                type="button"
                                onClick={startOCR}
                                disabled={isScanning || !imageSrc}
                                style={{ background: "#0284c7", color: "white", padding: "9px 16px", borderRadius: 6, fontWeight: 600, border: "none", cursor: isScanning || !imageSrc ? "not-allowed" : "pointer", opacity: isScanning || !imageSrc ? 0.5 : 1, fontSize: 13 }}
                            >
                                {isScanning ? "⏳ Reading..." : "▶ Read Entire Receipt"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRawText("")}
                                disabled={isScanning}
                                style={{ background: "#334155", color: "white", padding: "9px 14px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                Clear OCR Text
                            </button>
                        </div>

                        <div style={{ height: 7, background: "#334155", borderRadius: 10, overflow: "hidden", marginTop: 14 }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: "#38bdf8", transition: "width 0.2s" }} />
                        </div>

                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{status}</div>
                    </div>

                    {/* 03 / RAW OCR TEXT */}
                    <div style={{ background: "#192538", border: "1px solid #2c3b50", borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 15, color: "#38bdf8" }}>03 / Complete Raw OCR Text</h3>
                            <span style={{ background: "#164e63", color: "#67e8f9", padding: "4px 10px", borderRadius: 12, fontSize: 11 }}>
                                {rawText.length.toLocaleString()} characters
                            </span>
                        </div>

                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 10px" }}>
                            Recognized text across all sections. You can edit this text manually before compiling.
                        </p>

                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="All text recognized by Tesseract.js will appear here... Nothing is automatically removed from this area."
                            style={{
                                width: "100%",
                                minHeight: 180,
                                padding: 12,
                                background: "#0d1727",
                                color: "#dbeafe",
                                border: "1px solid #34465e",
                                borderRadius: 8,
                                font: "12px/1.6 Consolas, monospace",
                                resize: "vertical",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />

                        {/* ✅ NEW: Exchange rate input — only used when receipt is LBP. */}
                        <div
                            style={{
                                marginTop: 14,
                                padding: 12,
                                background: "#142033",
                                border: "1px solid #34465e",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <label
                                htmlFor="lbpRateInput"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#cbd5e1",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                💱 {isAr ? "سعر الصرف (ل.ل لكل دولار)" : "Exchange rate (LBP per $1)"}
                            </label>
                            <input
                                id="lbpRateInput"
                                type="number"
                                min="1"
                                step="1"
                                value={lbpRate}
                                onChange={(e) => setLbpRate(e.target.value)}
                                placeholder={String(DEFAULT_LBP_TO_USD_RATE)}
                                style={{
                                    width: 140,
                                    padding: "8px 10px",
                                    background: "#0d1727",
                                    color: "#dbeafe",
                                    border: "1px solid #34465e",
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontFamily: "Consolas, monospace",
                                    textAlign: "right",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setLbpRate(String(DEFAULT_LBP_TO_USD_RATE))}
                                style={{
                                    background: "#334155",
                                    color: "white",
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            >
                                ↻ {isAr ? "افتراضي" : "Default"}
                            </button>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {isAr
                                    ? "يُستخدم فقط إذا كانت الفاتورة بالليرة اللبنانية."
                                    : "Only applied when the receipt currency is LBP."}
                            </span>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <button
                                type="button"
                                onClick={compileReceipt}
                                style={{ background: "#059669", color: "white", padding: "10px 18px", borderRadius: 6, fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 }}
                            >
                                Compile Receipt Items ↓
                            </button>
                        </div>
                    </div>

                    {/* 04 / COMPILED ITEMS ONLY */}
                    <div
                        id="receipt-compiled-section"
                        style={{ background: "#192538", border: "1px solid #2c3b50", borderRadius: 12, padding: 16 }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: 15, color: "#38bdf8" }}>
                                04 / Compiled Items ({items.length})
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                style={{ background: "#334155", color: "white", padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12 }}
                            >
                                + Add Item
                            </button>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #34465e", color: "#94a3b8", fontSize: 12 }}>
                                        <th style={{ padding: "8px 6px", textAlign: "start" }}>Description</th>
                                        <th style={{ padding: "8px 6px", width: 80, textAlign: "center" }}>Quantity</th>
                                        <th style={{ padding: "8px 6px", width: 100, textAlign: "center" }}>Unit Price ($)</th>
                                        <th style={{ padding: "8px 6px", width: 44, textAlign: "center" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", padding: 24, color: "#64748b", fontSize: 13 }}>
                                                No items detected. Click "Compile Receipt Items ↓" or add them manually.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => (
                                            <tr key={item.id} style={{ borderBottom: "1px solid #34465e" }}>
                                                <td style={{ padding: "6px" }}>
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                                                        style={{ width: "100%", padding: 8, background: "#101827", color: "white", border: "1px solid #34465e", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                                                    />
                                                </td>
                                                <td style={{ padding: "6px" }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                                                        style={{ width: "100%", padding: 8, background: "#101827", color: "white", border: "1px solid #34465e", borderRadius: 6, fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                                                    />
                                                </td>
                                                <td style={{ padding: "6px" }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(idx, "price", e.target.value)}
                                                        style={{ width: "100%", padding: 8, background: "#101827", color: "white", border: "1px solid #34465e", borderRadius: 6, fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                                                    />
                                                </td>
                                                <td style={{ padding: "6px", textAlign: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        style={{ background: "#dc4654", color: "white", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", fontSize: 12 }}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderTop: "1px solid #2c3b50",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        background: "#101827",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "#334155", color: "white", padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                    >
                        {isAr ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={handlePushToCart}
                        disabled={items.length === 0}
                        style={{
                            background: "#059669",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: 8,
                            border: "none",
                            cursor: items.length === 0 ? "not-allowed" : "pointer",
                            fontWeight: 700,
                            fontSize: 13,
                            opacity: items.length === 0 ? 0.5 : 1,
                        }}
                    >
                        {isAr ? `إضافة إلى السلة (${items.length})` : `Add to Cart (${items.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}