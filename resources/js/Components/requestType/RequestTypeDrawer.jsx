import React, { useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Switch } from "@/Components/ui/switch";
import { Label } from "@/Components/ui/label";
import { useForm } from "react-hook-form";

// Renamed to RequestTypeDrawer to match import
export default function RequestTypeDrawer({
    visible, // Changed from open to visible
    mode,
    requestType,
    onClose,
    onSubmit,
}) {
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (visible) {
            // Changed from open to visible
            if (mode === "edit" && requestType) {
                setValue("request_category", requestType.request_category);
                setValue("request_name", requestType.request_name);
                setValue(
                    "request_description",
                    requestType.request_description,
                );
                setValue("is_active", requestType.is_active);
            } else {
                reset({ is_active: true });
            }
        }
    }, [visible, mode, requestType, setValue, reset]); // Added dependencies

    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            id: mode === "edit" ? requestType?.id : undefined,
        });
    };

    return (
        <Sheet open={visible} onOpenChange={onClose}>
            {" "}
            {/* Changed from open to visible */}
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create"
                            ? "Create Request Type"
                            : "Edit Request Type"}
                    </SheetTitle>
                    <SheetDescription>
                        Fill in the details for this request type.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="space-y-4 py-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="request_category">
                            Name (Category)
                        </Label>
                        <Input
                            id="request_category"
                            {...register("request_category", {
                                required: true,
                            })}
                            placeholder="e.g. Hardware"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="request_name">Option (Name)</Label>
                        <Input
                            id="request_name"
                            {...register("request_name", { required: true })}
                            placeholder="e.g. Desktop"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="request_description">Description</Label>
                        <Input
                            id="request_description"
                            {...register("request_description", {
                                required: true,
                            })}
                            placeholder="Short description"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch id="is_active" {...register("is_active")} />
                        <Label htmlFor="is_active">Active</Label>
                    </div>

                    <SheetFooter className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {mode === "create" ? "Create" : "Update"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
