import React, { useEffect, useRef, useState } from "react";
import { Form } from "antd";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { cn } from "@/lib/utils";

const REASONS = [
    { value: "defective", label: "Defective" },
    { value: "replacement", label: "Replacement" },
    { value: "upgrade", label: "Upgrade" },
    { value: "transfer", label: "Transfer to another unit" },
    { value: "obsolete", label: "Obsolete / End of Life" },
    { value: "other", label: "Other" },
];

const CONDITIONS = [
    { value: "working", label: "Working" },
    { value: "faulty", label: "Partially Working" },
    { value: "defective", label: "Defective — Return to Supplier" },
    { value: "unknown", label: "Unknown" },
];

const RemovalReasonModal = ({
    visible,
    onConfirm,
    onCancel,
    form,
    itemType = "item",
}) => {
    const [reason, setReason] = useState(null);
    const [condition, setCondition] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [errors, setErrors] = useState({});
    const confirmingRef = useRef(false);

    useEffect(() => {
        if (visible) {
            setReason(null);
            setCondition(null);
            setRemarks("");
            setErrors({});
            confirmingRef.current = false;
        }
    }, [visible]);

    const validate = () => {
        const e = {};
        if (!reason) e.reason = "Please select a reason";
        if (!condition) e.condition = "Please select the condition";
        return e;
    };

    const handleConfirm = () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        confirmingRef.current = true; // ← Mark as confirming
        onConfirm({ reason, condition, remarks: remarks || null });
    };

    const handleOpenChange = (open) => {
        if (!open && !confirmingRef.current) {
            onCancel();
        }
    };

    const title = `Reason for Removing ${itemType === "parts" ? "Part" : "Software"}`;

    return (
        <Dialog open={visible} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-1">
                    {/* ── Reason ── */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Reason for Removal{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            {REASONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                        setReason(value);
                                        setErrors((e) => ({
                                            ...e,
                                            reason: null,
                                        }));
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left",
                                        reason === value
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all",
                                            reason === value
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground/40",
                                        )}
                                    />
                                    {label}
                                </button>
                            ))}
                        </div>
                        {errors.reason && (
                            <p className="text-xs text-destructive">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    {/* ── Condition ── */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Current Condition{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={condition ?? ""}
                            onValueChange={(v) => {
                                setCondition(v);
                                setErrors((e) => ({ ...e, condition: null }));
                            }}
                        >
                            <SelectTrigger
                                className={cn(
                                    errors.condition && "border-destructive",
                                )}
                            >
                                <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITIONS.map(({ value, label }) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.condition && (
                            <p className="text-xs text-destructive">
                                {errors.condition}
                            </p>
                        )}
                    </div>

                    {/* ── Remarks ── */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Additional Remarks
                            <span className="ml-1 normal-case font-normal text-muted-foreground/60">
                                (optional)
                            </span>
                        </Label>
                        <Textarea
                            rows={3}
                            maxLength={500}
                            placeholder="Add any additional notes about the removal…"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="resize-none text-sm"
                        />
                        <p className="text-right text-[10px] text-muted-foreground/50">
                            {remarks.length}/500
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleConfirm}>
                        Confirm Removal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RemovalReasonModal;
