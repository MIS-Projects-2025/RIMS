import React from "react";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Clock,
    Check,
    Loader2,
    CheckCircle,
    Slash,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({ stats = {}, activeStatus, onStatusChange }) {
    const statusConfig = [
        {
            key: "New",
            value: 1,
            icon: <Clock className="text-yellow-500 h-6 w-6" />,
        },
        {
            key: "Triaged",
            value: 2,
            icon: <ThumbsUp className="text-green-500 h-6 w-6" />,
        },
        {
            key: "Approved",
            value: 3,
            icon: <Loader2 className="text-blue-500 h-6 w-6" />,
        },
        {
            key: "Issued",
            value: 4,
            icon: <Check className="text-green-600 h-6 w-6" />,
        },
        {
            key: "Acknowledged",
            value: 5,
            icon: <CheckCircle className="text-lime-500 h-6 w-6" />,
        },
        {
            key: "Canceled",
            value: 6,
            icon: <Slash className="text-gray-400 h-6 w-6" />,
        },
        {
            key: "Disapproved",
            value: 7,
            icon: <ThumbsDown className="text-red-500 h-6 w-6" />,
        },
    ];

    // Color mapping for each status
    const colorMap = {
        New: "border-yellow-500 bg-yellow-50",
        Triaged: "border-green-500 bg-green-50",
        Approved: "border-blue-500 bg-blue-50",
        Issued: "border-green-600 bg-green-50",
        Acknowledged: "border-lime-500 bg-lime-50",
        Canceled: "border-gray-400 bg-gray-50",
        Disapproved: "border-red-500 bg-red-50",
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-4">
            {statusConfig.map((status) => {
                const statusData = stats[status.key];
                const count = statusData?.count || 0;
                const isActive = activeStatus === status.value;

                return (
                    <Card
                        key={status.key}
                        className={cn(
                            "border-2 rounded-lg transition-all cursor-pointer hover:shadow-md",
                            isActive
                                ? colorMap[status.key]
                                : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() =>
                            onStatusChange(isActive ? "all" : status.value)
                        }
                    >
                        <CardContent className="flex flex-col items-center justify-between p-4 h-32">
                            <span className="text-sm font-medium text-gray-600">
                                {status.key}
                            </span>
                            <span
                                className={cn(
                                    "text-2xl font-bold",
                                    isActive
                                        ? "text-gray-900"
                                        : "text-gray-700",
                                )}
                            >
                                {count}
                            </span>
                            <div className="mt-auto">{status.icon}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
