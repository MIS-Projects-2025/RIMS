import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { usePage, router } from "@inertiajs/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";

const ActionRemarksModal = ({ open, onClose, action }) => {
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);
    const { request } = usePage().props;

    const handleSubmit = async () => {
        if (!remarks?.trim()) {
            toast.error("Please enter remarks");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(route("request.action"), {
                request_number: request.request_number,
                action,
                remarks,
            });

            if (response.data.success) {
                toast.success(response.data.message);
                window.location.reload();
                onClose();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error(
                error.response?.data?.message || "Failed to update request",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {action === "APPROVE" ? "Approve" : "Disapprove"}{" "}
                        Request
                    </DialogTitle>
                    <DialogDescription>
                        Please provide remarks for this action
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                            id="remarks"
                            placeholder="Enter your remarks here..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        variant={
                            action === "APPROVE" ? "default" : "destructive"
                        }
                    >
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {action === "APPROVE" ? "Approve" : "Disapprove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ActionRemarksModal;
