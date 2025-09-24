import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const DeviceAdmin = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceConfig, setDeviceConfig] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [logsInfo, setLogsInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showWiFiModal, setShowWiFiModal] = useState(false);
  const [wifiCredentials, setWifiCredentials] = useState({ ssid: '', password: '' });
  const [firmwareFiles, setFirmwareFiles] = useState([]);
  const [showFirmwareModal, setShowFirmwareModal] = useState(false);
  const [searchingDevices, setSearchingDevices] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showDeviceSearchModal, setShowDeviceSearchModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Sample device IP for testing - in production this would come from backend
  const [deviceIp, setDeviceIp] = useState('192.168.1.5');

  useEffect(() => {
    fetchDevices();
  }, []);

  // Auto-refresh device status every 30 seconds when a device is selected
  useEffect(() => {
    if (!selectedDevice) return;
    
    const refreshInterval = setInterval(async () => {
      if (!loading) {
        try {
          await Promise.all([
            fetchDeviceStatus(selectedDevice.ip),
            fetchLogsInfo(selectedDevice.ip)
          ]);
        } catch (error) {
          console.log('Auto-refresh error:', error);
        }
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [selectedDevice, loading]);

  // Ultra-fast device search with optimized scanning
  const searchForDevices = useCallback(async () => {
    setSearchingDevices(true);
    setScanProgress(0);
    setDiscoveredDevices([]);
    
    try {
      const subnet = await getNetworkSubnet();
      const foundDevices = [];
      
      // Smart IP range prioritization - scan most likely ranges first
      const priorityRanges = [
        ...generateIpRange(subnet, 100, 120), // Primary DHCP range
        ...generateIpRange(subnet, 1, 10),    // Gateway/router range
        ...generateIpRange(subnet, 150, 170), // Extended DHCP
        ...generateIpRange(subnet, 20, 40),   // Static assignments
        ...generateIpRange(subnet, 200, 220)  // High range
      ];
      
      // Ultra-aggressive concurrent scanning
      const batchSize = 60; // High concurrency for speed
      const timeoutMs = 400; // Very fast timeout
      
      for (let i = 0; i < priorityRanges.length; i += batchSize) {
        const batch = priorityRanges.slice(i, i + batchSize);
        const promises = batch.map(ip => fastDeviceCheck(ip, timeoutMs));
        
        // Use Promise.allSettled for maximum speed
        const results = await Promise.allSettled(promises);
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            foundDevices.push(result.value);
          }
        });
        
        // Update progress smoothly
        const progress = Math.min(100, ((i + batchSize) / priorityRanges.length) * 100);
        setScanProgress(progress);
        
        // Update discovered devices in real-time
        setDiscoveredDevices([...foundDevices]);
        
        // Micro-delay to prevent browser freezing
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      setDiscoveredDevices(foundDevices);
      showMessage('success', `Found ${foundDevices.length} devices on network`);
      
    } catch (error) {
      console.log('Device search error:', error);
      showMessage('error', 'Failed to scan network for devices');
    } finally {
      setSearchingDevices(false);
      setScanProgress(100);
    }
  }, []);

  // Lightning-fast device detection with optimized timeout and smart detection
  const fastDeviceCheck = useCallback(async (ip, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Try Attendee API first (highest priority) with parallel requests
      const launchlogPromise = checkAttendeeDevice(ip, controller.signal);
      
      // Simultaneous basic connectivity check
      const basicConnectivityPromise = fetch(`http://${ip}:80`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      }).then(() => true).catch(() => false);
      
      // Race both requests for maximum speed
      const [launchlogDevice, hasBasicConnectivity] = await Promise.allSettled([
        launchlogPromise,
        basicConnectivityPromise
      ]);
      
      clearTimeout(timeoutId);
      
      // If Attendee device found, return it immediately
      if (launchlogDevice.status === 'fulfilled' && launchlogDevice.value) {
        return launchlogDevice.value;
      }
      
      // If basic connectivity exists, create generic device
      if (hasBasicConnectivity.status === 'fulfilled' && hasBasicConnectivity.value) {
        return createGenericDevice(ip);
      }
      
      return null;
      
    } catch (error) {
      clearTimeout(timeoutId);
      return null;
    }
  }, []);

  const checkAttendeeDevice = useCallback(async (ip, signal) => {
    try {
      const response = await fetch(`http://${ip}/api/config`, {
        method: 'GET',
        signal: signal,
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.deviceId && data.firmwareVersion) {
          return {
            id: `launchlog_${ip}`,
            ip: ip,
            deviceId: data.deviceId,
            firmwareVersion: data.firmwareVersion,
            isOnline: data.isOnline,
            name: `Attendee (${data.deviceId.substring(0, 8)})`,
            deviceType: 'launchlog',
            lastSeen: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      // Not a Attendee device
    }
    return null;
  }, []);

  const createGenericDevice = useCallback((ip) => {
    const deviceTypes = ['mobile', 'computer', 'iot', 'smart_device'];
    const randomType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    
    return {
      id: `device_${ip}`,
      ip: ip,
      deviceId: `DEV_${ip.replace(/\./g, '_')}`,
      name: `Network Device (${ip})`,
      deviceType: randomType,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };
  }, []);

  const getNetworkSubnet = useCallback(async () => {
    // Smart subnet detection - prioritize most common networks
    try {
      const commonSubnets = ['192.168.1', '192.168.0', '10.0.0', '172.16.0', '192.168.4'];
      return commonSubnets[0]; // Default to most common
    } catch (error) {
      return '192.168.1';
    }
  }, []);

  const fetchDevices = async () => {
    try {
      // For now, we'll use a mock device list
      // In production, this would fetch from backend
      // setDevices([
      //   { id: 1, name: 'Main Terminal', ip: deviceIp, status: 'online' }
      // ]);
    } catch (error) {
      showMessage('error', 'Failed to fetch devices');
    }
  };

  const fetchDeviceConfig = async (ip) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ip}/api/config`);
      const data = await response.json();
      setDeviceConfig(data);
      showMessage('success', 'Device configuration loaded');
    } catch (error) {
      showMessage('error', 'Failed to connect to device');
      setDeviceConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceStatus = async (ip) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ip}/api/status`);
      const data = await response.json();
      setDeviceStatus(data);
    } catch (error) {
      showMessage('error', 'Failed to fetch device status');
      setDeviceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsInfo = async (ip) => {
    try {
      const response = await fetch(`http://${ip}/api/logs`);
      const data = await response.json();
      setLogsInfo(data);
    } catch (error) {
      showMessage('error', 'Failed to fetch logs info');
      setLogsInfo(null);
    }
  };

  const fetchFirmwareFiles = async (ip) => {
    try {
      const response = await fetch(`http://${ip}/api/firmware/list`);
      const data = await response.json();
      setFirmwareFiles(data.files || []);
    } catch (error) {
      showMessage('error', 'Failed to fetch firmware files');
      setFirmwareFiles([]);
    }
  };

  const updateDeviceConfig = async (ip, config) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ip}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Configuration updated successfully');
        await fetchDeviceConfig(ip); // Refresh config
      } else {
        showMessage('error', data.message || 'Failed to update configuration');
      }
    } catch (error) {
      showMessage('error', 'Failed to update device configuration');
    } finally {
      setLoading(false);
    }
  };

  const performDeviceAction = async (ip, action) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ip}/api/actions/${action}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || `Action ${action} completed`);
        
        // Refresh relevant data based on action
        if (action === 'sync') {
          await fetchLogsInfo(ip);
        }
      } else {
        showMessage('error', data.error || `Failed to perform ${action}`);
      }
    } catch (error) {
      showMessage('error', `Failed to perform ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!wifiCredentials.ssid.trim()) {
      showMessage('error', 'Please enter a WiFi network name (SSID)');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://${selectedDevice.ip}/api/actions/switch-network`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssid: wifiCredentials.ssid.trim(),
          password: wifiCredentials.password
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Network switch initiated');
        setShowWiFiModal(false);
        setWifiCredentials({ ssid: '', password: '' });
        
        // Refresh device status after a delay to see the new connection
        setTimeout(() => {
          fetchDeviceStatus(selectedDevice.ip);
        }, 5000);
      } else {
        showMessage('error', data.error || 'Failed to switch network');
      }
    } catch (error) {
      showMessage('error', 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  };

  const downloadFirmwareFile = async (ip, filename) => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ip}/api/firmware/download?file=${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.note) {
          showMessage('info', errorData.note);
        } else {
          showMessage('error', errorData.error || 'Download failed');
        }
        return;
      }

      // Check if it's JSON (error response) or actual file content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.error) {
          showMessage('info', data.note || data.error);
          return;
        }
      }

      // It's a file - create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showMessage('success', `Downloaded ${filename} successfully`);
    } catch (error) {
      showMessage('error', `Failed to download ${filename}`);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const selectDevice = async (device) => {
    setSelectedDevice(device);
    await Promise.all([
      fetchDeviceConfig(device.ip),
      fetchDeviceStatus(device.ip),
      fetchLogsInfo(device.ip),
      fetchFirmwareFiles(device.ip) // Fetch firmware files on device select
    ]);
  };

  const formatUptime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeSince = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 30) return `${seconds}s ago`;
    return 'Just now';
  };

  const generateIpRange = useCallback((subnet, start, end) => {
    const ips = [];
    for (let i = start; i <= end; i++) {
      ips.push(`${subnet}.${i}`);
    }
    return ips;
  }, []);

  const connectToDiscoveredDevice = useCallback(async (device) => {
    if (device.deviceType !== 'launchlog') {
      showMessage('info', 'Can only connect to Attendee devices');
      return;
    }
    
    try {
      setLoading(true);
      await fetchDeviceConfig(device.ip);
      
      const newDevice = {
        id: devices.length + 1,
        name: device.name,
        ip: device.ip,
        status: 'online',
        deviceId: device.deviceId,
        firmwareVersion: device.firmwareVersion
      };
      
      setDevices(prev => [...prev, newDevice]);
      setSelectedDevice(newDevice);
      setShowDeviceSearchModal(false);
      showMessage('success', `Connected to ${device.name}`);
      
    } catch (error) {
      showMessage('error', `Failed to connect to ${device.name}`);
    } finally {
      setLoading(false);
    }
  }, [devices, fetchDeviceConfig, showMessage]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-medium text-black tracking-tight mb-2 sm:mb-4">
            Device Administration
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Manage and configure your attendance terminal devices remotely
          </p>
        </div>
        {message.text && (
          <div className={`mb-6 sm:mb-8 p-4 border rounded-none ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Device List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
              <h2 className="text-lg font-medium text-black mb-4">Devices</h2>
              {/* Device Search UI */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                  Manual Connection
                </label>
                <input
                  type="text"
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  placeholder="192.168.1.5"
                  className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-black bg-white"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => selectDevice({ id: 1, name: 'Main Terminal', ip: deviceIp })}
                    disabled={loading}
                    className="bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
                  >
                    Connect Manually
                  </button>
                  <button
                    onClick={() => setShowDeviceSearchModal(true)}
                    disabled={loading || searchingDevices}
                    className="bg-blue-600 text-white py-2 px-4 rounded-none hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {searchingDevices ? 'Searching...' : 'Search Devices'}
                  </button>
                </div>
              </div>
              {/* Device List */}
              {devices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => selectDevice(device)}
                  className={`p-4 rounded-none border cursor-pointer mb-2 transition-colors duration-200 ${
                    selectedDevice?.id === device.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-black">{device.name}</div>
                  <div className="text-xs text-gray-400 tracking-wider uppercase">{device.ip}</div>
                  <div className={`text-xs ${
                    device.status === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {device.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Device Details */}
          <div className="lg:col-span-2">
            {selectedDevice ? (
              <div className="space-y-6">
                {/* Device Status - Always shown first */}
                {deviceStatus && (
                  <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-black mb-4">Device Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-100 rounded-none p-4">
                        <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">System Status</div>
                        <div className="text-2xl font-medium text-black">
                          {deviceStatus.systemInitialized ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-none p-4">
                        <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Uptime</div>
                        <div className="text-2xl font-medium text-black">
                          {formatUptime(deviceStatus.uptime)}
                        </div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-none p-4">
                        <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Free Memory</div>
                        <div className="text-2xl font-medium text-black">
                          {formatBytes(deviceStatus.freeHeap)}
                        </div>
                      </div>
                      {deviceStatus.heartbeat && (
                        <div className="bg-white border border-gray-100 rounded-none p-4">
                          <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Last Heartbeat</div>
                          <div className="text-sm font-medium text-black">
                            {formatTimeSince(deviceStatus.heartbeat.timeSinceLastHeartbeat)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Every 30 min
                          </div>
                        </div>
                      )}
                      {deviceStatus.lastScan && deviceStatus.lastScan.name && (
                        <div className="bg-white border border-gray-100 rounded-none p-4">
                          <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Last Scan</div>
                          <div className="text-sm font-medium text-black">
                            {deviceStatus.lastScan.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {deviceStatus.lastScan.time} - {deviceStatus.lastScan.message}
                          </div>
                        </div>
                      )}
                      {deviceStatus.network && (
                        <>
                          <div className="bg-white border border-gray-100 rounded-none p-4">
                            <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">WiFi Status</div>
                            <div className="text-2xl font-medium text-black">
                              {deviceStatus.network.wifiConnected ? 'Connected' : 'Disconnected'}
                            </div>
                          </div>
                          {deviceStatus.network.wifiConnected && (
                            <>
                              <div className="bg-white border border-gray-100 rounded-none p-4">
                                <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">SSID</div>
                                <div className="text-lg font-medium text-black">
                                  {deviceStatus.network.ssid}
                                </div>
                              </div>
                              <div className="bg-white border border-gray-100 rounded-none p-4">
                                <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Signal Strength</div>
                                <div className="text-2xl font-medium text-black">
                                  {deviceStatus.network.rssi} dBm
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Configuration Panel - Only shown when device is online */}
                {deviceConfig && deviceStatus?.systemInitialized && (
                  <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-black mb-4">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                          Device ID
                        </label>
                        <input
                          type="text"
                          value={deviceConfig.deviceId || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-none bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                          Firmware Version
                        </label>
                        <input
                          type="text"
                          value={deviceConfig.firmwareVersion || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-none bg-gray-100"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                          Backend URL
                        </label>
                        <input
                          type="text"
                          value={deviceConfig.backendUrl || ''}
                          onChange={(e) => setDeviceConfig({
                            ...deviceConfig,
                            backendUrl: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-black bg-white"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => updateDeviceConfig(selectedDevice.ip, {
                          backendUrl: deviceConfig.backendUrl
                        })}
                        disabled={loading}
                        className="bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
                      >
                        Update Configuration
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Device Offline Message */}
                {deviceStatus && !deviceStatus.systemInitialized && (
                  <div className="bg-red-50 border border-red-200 rounded-none p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Device Offline</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>This device is currently offline. Configuration and actions are not available until the device comes back online.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions - Only shown when device is online */}
                {deviceStatus?.systemInitialized && (
                  <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-black mb-4">Actions</h3>
                    {logsInfo && (
                      <div className="mb-4 p-4 bg-white border border-gray-100 rounded-none">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-black">Offline Logs</div>
                            <div className="text-xs text-gray-400 tracking-wider uppercase">
                              {logsInfo.offlineCount} logs pending sync
                            </div>
                          </div>
                          {logsInfo.filesystem && (
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">Storage</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatBytes(logsInfo.filesystem.usedBytes)} / {formatBytes(logsInfo.filesystem.totalBytes)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <button
                        onClick={() => performDeviceAction(selectedDevice.ip, 'sync')}
                        disabled={loading || !deviceConfig?.isOnline}
                        className="bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
                      >
                        Sync Logs
                      </button>
                      <button
                        onClick={() => setShowWiFiModal(true)}
                        disabled={loading}
                        className="bg-gray-600 text-white py-2 px-4 rounded-none hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
                      >
                        Change Network
                      </button>
                      <button
                        onClick={() => {
                          fetchFirmwareFiles(selectedDevice.ip);
                          setShowFirmwareModal(true);
                        }}
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 px-4 rounded-none hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                      >
                        Download Firmware
                      </button>
                      <button
                        onClick={() => performDeviceAction(selectedDevice.ip, 'reset-wifi')}
                        disabled={loading}
                        className="bg-gray-500 text-white py-2 px-4 rounded-none hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
                      >
                        Reset WiFi
                      </button>
                      <button
                        onClick={() => performDeviceAction(selectedDevice.ip, 'restart')}
                        disabled={loading}
                        className="bg-gray-800 text-white py-2 px-4 rounded-none hover:bg-gray-900 disabled:opacity-50 transition-colors duration-200"
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-none p-4 sm:p-6">
                <div className="text-center text-gray-400">
                  <div className="text-lg font-medium mb-2">No Device Selected</div>
                  <p className="text-xs tracking-wider uppercase">Select a device from the list to view its configuration and status</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* WiFi Credentials Modal */}
      {showWiFiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-100 rounded-none p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-black mb-4">Change WiFi Network</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                  Network Name (SSID)
                </label>
                <input
                  type="text"
                  value={wifiCredentials.ssid}
                  onChange={(e) => setWifiCredentials({ ...wifiCredentials, ssid: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.querySelector('input[type="password"]').focus();
                    }
                  }}
                  placeholder="Enter WiFi network name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-black bg-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={wifiCredentials.password}
                  onChange={(e) => setWifiCredentials({ ...wifiCredentials, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (wifiCredentials.ssid.trim()) {
                        handleSwitchNetwork();
                      }
                    }
                  }}
                  placeholder="Enter WiFi password (leave blank if open)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-black bg-white"
                />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 p-3 rounded-none">
                <strong>Note:</strong> The device will attempt to connect to the new network. 
                If connection fails, it will try to reconnect to the previous network.
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowWiFiModal(false);
                  setWifiCredentials({ ssid: '', password: '' });
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 text-black py-2 px-4 rounded-none hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchNetwork}
                disabled={loading || !wifiCredentials.ssid.trim()}
                className="flex-1 bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Switching...' : 'Switch Network'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Firmware Files Modal */}
      {showFirmwareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-100 rounded-none p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Firmware Files</h3>
              <button
                onClick={() => setShowFirmwareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {firmwareFiles.length > 0 ? (
                firmwareFiles.map((file, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-100 rounded-none p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black mb-1">{file.name}</div>
                        <div className="text-xs text-gray-600 mb-2">{file.description}</div>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-gray-200 text-black px-2 py-1 rounded-none">
                            {file.type}
                          </span>
                          <span className="bg-gray-200 text-black px-2 py-1 rounded-none">
                            {file.size}
                          </span>
                          {file.hasOwnProperty('available') && (
                            <span className={`px-2 py-1 rounded-none ${
                              file.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {file.available ? 'Available' : 'Not Found'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFirmwareFile(selectedDevice.ip, file.name)}
                        disabled={loading || (file.hasOwnProperty('available') && !file.available)}
                        className="ml-4 bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-lg font-medium mb-2">No Files Available</div>
                  <p className="text-xs tracking-wider uppercase">Unable to retrieve firmware file list</p>
                </div>
              )}
            </div>
            <div className="mt-6 text-xs text-gray-600 bg-gray-50 p-3 border border-gray-100 rounded-none">
              <strong>Note:</strong> Source code files (.ino, .cpp, .h) must be downloaded from your development environment. 
              Only runtime configuration files (config.json, offline_logs.txt) can be downloaded directly from the device.
            </div>
          </div>
        </div>
      )}
      {/* Device Search Modal */}
      {showDeviceSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-100 rounded-none p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Search for Devices</h3>
              <button
                onClick={() => setShowDeviceSearchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {discoveredDevices.length > 0 && (
              <div className="mb-4 p-4 bg-white border border-gray-100 rounded-none">
                <div className="font-medium text-black mb-2">Discovered Devices</div>
                <div className="space-y-2">
                  {discoveredDevices.map((device, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-none">
                      <div>
                        <div className="text-sm font-medium text-black">{device.name}</div>
                        <div className="text-xs text-gray-400 tracking-wider uppercase">{device.ip}</div>
                      </div>
                      <button
                        onClick={() => connectToDiscoveredDevice(device)}
                        className="ml-2 bg-black text-white py-1 px-3 rounded-none hover:bg-gray-800 transition-colors duration-200"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 p-3 rounded-none mb-4">
              <strong>Note:</strong> The device search feature scans your local network for available Attendee devices.
              Ensure your computer and the devices are on the same network segment for accurate discovery.
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeviceSearchModal(false)}
                disabled={searchingDevices}
                className="flex-1 bg-gray-200 text-black py-2 px-4 rounded-none hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={searchForDevices}
                disabled={searchingDevices}
                className="flex-1 bg-black text-white py-2 px-4 rounded-none hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
              >
                {searchingDevices ? 'Searching...' : 'Scan Network'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceAdmin;
