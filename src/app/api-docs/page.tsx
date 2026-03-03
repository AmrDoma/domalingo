"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – no type declarations for this CSS side-effect import
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then(setSpec);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">🦜</span>
        <div>
          <h1 className="text-white font-bold text-xl leading-none">
            Domalingo API
          </h1>
          <p className="text-indigo-200 text-sm">
            OpenAPI 3.0 — Interactive Documentation
          </p>
        </div>
      </div>

      {spec ? (
        <SwaggerUI spec={spec} docExpansion="list" tryItOutEnabled={true} />
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading spec…
        </div>
      )}
    </div>
  );
}
