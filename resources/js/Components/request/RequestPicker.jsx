import React from "react";
import { useForm } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/Components/ui/form";

const RequestPicker = ({
    catalog,
    selectedRequest,
    setSelectedRequest,
    onAdd,
    mode,
}) => {
    const form = useForm({
        defaultValues: {
            request: selectedRequest || "",
        },
    });

    const handleAdd = () => {
        onAdd();
        form.reset({ request: "" });
        setSelectedRequest(null);
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Add Request
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <div className="flex items-start gap-3">
                        <FormField
                            control={form.control}
                            name="request"
                            render={({ field }) => (
                                <FormItem className="flex-1 max-w-xs">
                                    <FormControl>
                                        <Select
                                            value={selectedRequest || ""}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                setSelectedRequest(val);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select request type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalog.map((cat) => (
                                                    <SelectGroup
                                                        key={cat.category}
                                                    >
                                                        <SelectLabel className="font-semibold text-xs uppercase tracking-wide text-muted-foreground px-2 py-1">
                                                            {cat.category}
                                                        </SelectLabel>
                                                        {cat.items.map(
                                                            (item) => (
                                                                <SelectItem
                                                                    key={item}
                                                                    value={item}
                                                                >
                                                                    {item}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="button"
                            onClick={handleAdd}
                            className="gap-2"
                        >
                            <PlusIcon size={16} />
                            Add
                        </Button>
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
};

export default RequestPicker;
