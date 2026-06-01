import React from "react";
import { ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";

const Cart = ({ cart, onEdit, onRemove }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShoppingCart size={18} />
                Request Cart
            </CardTitle>
        </CardHeader>
        <CardContent>
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <ShoppingCart size={36} className="opacity-30" />
                    <p className="text-sm">No items added</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {cart.map((item, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between py-3">
                                {/* Left */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm">
                                            {item.name}
                                        </span>
                                        <Badge variant="secondary">
                                            {item.category}
                                        </Badge>
                                        {item.mode === "bulk" && (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                BULK
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {item.mode === "bulk"
                                            ? `${item.bulkData?.items?.length || 0} item(s) selected`
                                            : `${item.items?.length || 0} location(s)`}
                                    </p>
                                </div>

                                {/* Right */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-muted-foreground hover:text-foreground"
                                        onClick={() => onEdit(index)}
                                    >
                                        <Pencil size={14} />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-destructive hover:text-destructive"
                                        onClick={() => onRemove(index)}
                                    >
                                        <Trash2 size={14} />
                                        Remove
                                    </Button>
                                </div>
                            </div>

                            {index < cart.length - 1 && <Separator />}
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
);

export default Cart;
