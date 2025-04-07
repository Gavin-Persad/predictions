//src/app/viewseason/components/laveryCup/editLaveryCup.tsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../../../supabaseClient";
import { Layout } from "./editLaveryCupLayout";

interface Props {
    seasonId: string;
    onClose: () => void;
}

export default function EditLaveryCup({ seasonId, onClose }: Props): JSX.Element {
    const [loading, setLoading] = useState(true);

    // Fetch data when component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Data fetching will be implemented later
                
                // Simulate loading for now
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching Lavery Cup data:', error);
                setLoading(false);
            }
        };
        
        fetchData();
    }, [seasonId]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col mb-6">
                <div className="mb-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                        Back
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
                    Edit Lavery Cup
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            ) : (
                <div className={Layout.container}>
                    <div className="flex justify-center items-center h-64 w-full">
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                            Lavery Cup editor coming soon
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}