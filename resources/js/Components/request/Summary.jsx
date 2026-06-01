import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";

const Summary = ({ cart }) => {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmitClick = () => {
        if (cart.length === 0) {
            toast.warning("Please add items to your request");
            return;
        }

        const hasEmptyItems = cart.some((item) => {
            if (item.mode === "per-item") {
                return (
                    !item.items ||
                    item.items.length === 0 ||
                    item.items.some((i) => !i.issued_to || !i.location || !i.qty)
                );
            } else {
                return (
                    !item.bulkData?.items ||
                    item.bulkData.items.length === 0 ||
                    !item.bulkData.issued_to ||
                    !item.bulkData.location
                );
            }
        });

        if (hasEmptyItems) {
            toast.error("Please complete all request details before submitting");
            return;
        }

        setShowConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        setShowConfirm(false);

        try {
            const response = await axios.post(route("request.store"), { cart });

            if (response.data.success) {
                toast.success(
                    `Request submitted! Request Number: ${response.data.request_number}`
                );
                setTimeout(() => window.location.reload(), 500);
            } else {
                toast.error(response.data.message || "Failed to submit request");
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "An error occurred while submitting the request"
            );
        } finally {
            setLoading(false);
        }
    };

    const getTotalItems = () =>
        cart.reduce((total, item) => {
            if (item.mode === "bulk") return total + (item.bulkData?.items?.length || 0);
            return total + (item.items?.length || 0);
        }, 0);

    const getTotalQuantity = () =>
        cart.reduce((total, item) => {
            if (item.mode === "bulk") {
                return (
                    total +
                    (item.bulkData?.items?.reduce((sum, i) => sum + Number(i.qty || 0), 0) || 0)
                );
            }
            return (
                total +
                (item.items?.reduce((sum, i) => sum + Number(i.qty || 0), 0) || 0)
            );
        }, 0);

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No items in cart
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Total Requests:</span>
                                    <span>{cart.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Total Items:</span>
                                    <span>{getTotalItems()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Total Quantity:</span>
                                    <span>{getTotalQuantity()}</span>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {cart.map((c, i) => (
                                <div key={i} className="mb-4">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-semibold text-sm">{c.name}</span>
                                        {c.mode === "bulk" && (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                                                BULK
                                            </Badge>
                                        )}
                                    </div>

                                    {c.mode === "bulk" ? (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                            <p>Items: {c.bulkData?.items?.length || 0}</p>
                                            <p>
                                                Total Qty:{" "}
                                                {c.bulkData?.items?.reduce(
                                                    (sum, item) => sum + Number(item.qty || 0),
                                                    0
                                                ) || 0}
                                            </p>
                                            {c.bulkData?.issued_to && (
                                                <p>Issued to: {c.bulkData.issued_to_name}</p>
                                            )}
                                            {c.bulkData?.location && (
                                                <p>Location: {c.bulkData.location_name}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                            <p>
                                                Total Qty:{" "}
                                                {c.items?.reduce(
                                                    (sum, r) => sum + Number(r.qty || 0),
                                                    0
                                                ) || 0}
                                            </p>
                                            {c.purpose && <p>Purpose: {c.purpose}</p>}
                                        </div>
                                    )}

                                    <Separator className="mt-3" />
                                </div>
                            ))}
                        </>
                    )}

                    <Button
                        className="w-full mt-2"
                        size="lg"
                        disabled={cart.length === 0 || loading}
                        onClick={handleSubmitClick}
                    >
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Submission</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit this request with{" "}
                            <strong>{getTotalItems()}</strong> item(s) and total quantity of{" "}
                            <strong>{getTotalQuantity()}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-xs text-muted-foreground">
                        Once submitted, you cannot edit the request.
                    </p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmSubmit} disabled={loading}>
                            {loading ? "Submitting..." : "Yes, Submit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Summary;