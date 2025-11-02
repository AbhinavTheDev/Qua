"use client";
import { useState, useEffect } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";

import { ApiRequest, ApiResponse } from "@/lib/constants";
import Highlighter from "./highlighter";
import HistoryTab from "./history";

export default function Homepage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const parseHeaders = (headerString: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (!headerString.trim()) return headers;

    headerString.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(":").trim();
      }
    });
    return headers;
  };

  const formatHeaders = (headers: Record<string, string>): string => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  };

  const sendRequest = async () => {
    if (!url.trim()) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const parsedHeaders = parseHeaders(headers);
      const requestOptions: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body.trim()) {
        requestOptions.body = body;
      }

      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, requestOptions }),
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.json();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseText.data ?? responseText,
        responseTime,
      });

      // Save to DB
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, url, headers: parsedHeaders, body }),
      });
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        data: error instanceof Error ? error.message : "Unknown error occurred",
        responseTime: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (request: ApiRequest) => {
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(formatHeaders(request.headers));
    setBody(request.body);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="pb-0">
          <div className="px-2 pt-2">
            <h1 className="text-xl font-semibold leading-tight">Qua</h1>
            <p className="text-xs text-gray-500">Test REST APIs with ease</p>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <div className="p-2">
            <HistoryTab loadFromHistory={loadFromHistory} />
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b p-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl font-semibold leading-tight">Request Playground</h1>
          </div>
        </header>

        <div className="p-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Enter request URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendRequest} disabled={loading || !url.trim()}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headers">Headers</Label>
                  <Textarea
                    id="headers"
                    placeholder={"Content-Type: application/json\nAuthorization: Bearer token"}
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    rows={3}
                  />
                </div>

                {method !== "GET" && method !== "HEAD" && (
                  <div className="space-y-2">
                    <Label htmlFor="body">Request Body</Label>
                    <Textarea
                      id="body"
                      placeholder="Enter request body (JSON, XML, etc.)"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {response && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Response
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${getStatusColor(response.status)}`}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="text-gray-500">{response.responseTime}ms</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Response Headers</Label>
                    <ScrollArea className="h-24 w-full border rounded-md p-2 mt-1">
                      <pre className="text-xs text-gray-600">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key}>
                            {key}: {value}
                          </div>
                        ))}
                      </pre>
                    </ScrollArea>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Response Body</Label>
                    <ScrollArea className="h-64 w-full border rounded-md p-2 mt-1">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {Highlighter(
                          typeof response.data === "string"
                            ? response.data
                            : JSON.stringify(response.data, null, 2)
                        )}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
