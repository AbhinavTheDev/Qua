"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiRequest, HistoryProps } from "@/lib/constants";

export default function HistoryTab({ loadFromHistory }: HistoryProps) {
  const [history, setHistory] = useState<ApiRequest[]>([]);

  const fetchHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistory(
      data.map((h: any) => ({
        id: h.id.toString(),
        method: h.method,
        url: h.url,
        headers: JSON.parse(h.headers),
        body: h.body,
        timestamp: new Date(h.createdAt),
      }))
    );
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "PUT":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "DELETE":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "PATCH":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const clearHistory = async () => {
    await fetch("/api/history", { method: "DELETE" });
    await fetchHistory();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>History</CardTitle>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No requests in history yet</p>
              <p className="text-sm">
                Make your first API request to see it here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {history.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => loadFromHistory(request)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge className={getMethodColor(request.method)}>
                        {request.method}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {request.url}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
