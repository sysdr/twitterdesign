import React from 'react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Twitter Microservices Architecture
        </h1>
        <p className="text-xl text-gray-600">
          Production-ready distributed system with independent scaling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Architecture Overview</h2>
          <ul className="space-y-3 text-gray-700">
            <li>🚀 API Gateway with intelligent routing</li>
            <li>🔐 Authentication & authorization</li>
            <li>⚖️ Load balancing & rate limiting</li>
            <li>🔍 Service discovery with Consul</li>
            <li>📊 Health monitoring & metrics</li>
            <li>🏗️ Independent service scaling</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Microservices</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>User Service</span>
              <span className="text-green-500">:3002</span>
            </div>
            <div className="flex justify-between">
              <span>Tweet Service</span>
              <span className="text-green-500">:3003</span>
            </div>
            <div className="flex justify-between">
              <span>Timeline Service</span>
              <span className="text-green-500">:3004</span>
            </div>
            <div className="flex justify-between">
              <span>Media Service</span>
              <span className="text-green-500">:3005</span>
            </div>
            <div className="flex justify-between">
              <span>Notification Service</span>
              <span className="text-green-500">:3006</span>
            </div>
            <div className="flex justify-between">
              <span>Analytics Service</span>
              <span className="text-green-500">:3007</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/monitor"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
        >
          View Service Monitor →
        </Link>
      </div>
    </div>
  );
};
