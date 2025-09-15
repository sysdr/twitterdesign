import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Statistic, Table, Tag, Button, message, Space } from 'antd';
import { 
  DatabaseOutlined, 
  ThunderboltOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';
import { CacheService } from '../../services/CacheService';
import './Dashboard.css';

const { Header, Content } = Layout;

interface CacheOperation {
  key: string;
  operation: 'GET' | 'SET' | 'DELETE';
  timestamp: number;
  success: boolean;
  nodeId: string;
}

const Dashboard: React.FC = () => {
  const { metrics, isConnected } = useRealTimeMetrics();
  const [operations, setOperations] = useState<CacheOperation[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update performance data when metrics change
    if (metrics) {
      setPerformanceData(prev => [
        ...prev.slice(-9), // Keep last 9 entries
        {
          time: new Date(metrics.timestamp).toLocaleTimeString(),
          hitRate: metrics.overallHitRate,
          avgResponseTime: metrics.avgResponseTime,
          totalOps: metrics.totalHits + metrics.totalMisses
        }
      ]);
    }
  }, [metrics]);

  const handleTestCache = async () => {
    setLoading(true);
    try {
      // Perform test operations
      const testOperations = [
        { key: 'test:user:123', value: { id: 123, name: 'John Doe', followers: 1500 } },
        { key: 'test:tweet:456', value: { id: 456, content: 'Hello World!', likes: 42 } },
        { key: 'test:trending:hashtag', value: { tag: '#distributed', count: 12500 } }
      ];

      for (const op of testOperations) {
        await CacheService.set(op.key, op.value);
        const result = await CacheService.get(op.key);
        
        setOperations(prev => [
          {
            key: op.key,
            operation: 'SET',
            timestamp: Date.now(),
            success: true,
            nodeId: 'test-node'
          },
          {
            key: op.key,
            operation: 'GET',
            timestamp: Date.now() + 1,
            success: result.success,
            nodeId: 'test-node'
          },
          ...prev
        ].slice(0, 50));
      }

      message.success('Cache test operations completed successfully!');
    } catch (error) {
      message.error('Cache test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      await CacheService.flushAll();
      message.success('All caches flushed successfully!');
    } catch (error) {
      message.error('Failed to flush cache: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'Cache Key',
      dataIndex: 'key',
      key: 'key',
      ellipsis: true,
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      render: (op: string) => (
        <Tag color={op === 'GET' ? 'blue' : op === 'SET' ? 'green' : 'red'}>
          {op}
        </Tag>
      ),
    },
    {
      title: 'Node',
      dataIndex: 'nodeId',
      key: 'nodeId',
    },
    {
      title: 'Status',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? 'SUCCESS' : 'FAILED'}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleTimeString(),
    },
  ];

  const renderNodeStats = () => {
    if (!metrics?.nodesStats) return null;

    return Object.entries(metrics.nodesStats).map(([nodeId, stats]: [string, any]) => (
      <Col span={8} key={nodeId}>
        <Card size="small" title={`Node: ${nodeId}`}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Hit Rate"
                value={stats.hitRate}
                suffix="%"
                valueStyle={{ color: parseFloat(stats.hitRate) > 80 ? '#3f8600' : '#cf1322' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Response Time"
                value={stats.avgResponseTime}
                suffix="ms"
                valueStyle={{ color: parseFloat(stats.avgResponseTime) < 50 ? '#3f8600' : '#cf1322' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Statistic title="Hits" value={stats.hits} />
            </Col>
            <Col span={12}>
              <Statistic title="Misses" value={stats.misses} />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Distributed Cache Control Center</h1>
          <div className="connection-status">
            <Tag color={isConnected ? 'success' : 'error'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Tag>
          </div>
        </div>
      </Header>

      <Content className="dashboard-content">
        {/* Overview Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Overall Hit Rate"
                value={metrics?.overallHitRate || 0}
                precision={2}
                suffix="%"
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: (metrics?.overallHitRate || 0) > 80 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg Response Time"
                value={metrics?.avgResponseTime || 0}
                precision={2}
                suffix="ms"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: (metrics?.avgResponseTime || 0) < 50 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Hits"
                value={metrics?.totalHits || 0}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Healthy Nodes"
                value={`${metrics?.health?.healthyNodes || 0}/${metrics?.health?.totalNodes || 0}`}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Performance Charts */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="Cache Hit Rate Over Time" size="small">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="hitRate" 
                    stroke="#52c41a" 
                    strokeWidth={2}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Response Time Trends" size="small">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgResponseTime" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Node Statistics */}
        <Card title="Node Performance Statistics" style={{ marginBottom: 24 }} size="small">
          <Row gutter={16}>
            {renderNodeStats()}
          </Row>
        </Card>

        {/* Operations Panel */}
        <Row gutter={16}>
          <Col span={16}>
            <Card 
              title="Recent Cache Operations" 
              size="small"
              extra={
                <Space>
                  <Button 
                    type="primary" 
                    icon={<FireOutlined />}
                    loading={loading}
                    onClick={handleTestCache}
                  >
                    Run Cache Test
                  </Button>
                  <Button 
                    danger 
                    icon={<ReloadOutlined />}
                    onClick={handleFlushCache}
                  >
                    Flush All Caches
                  </Button>
                </Space>
              }
            >
              <Table 
                columns={columns} 
                dataSource={operations.map((op, index) => ({ ...op, key: index }))}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ y: 300 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="System Health" size="small">
              {metrics?.health && (
                <div className="health-status">
                  <div className="health-item">
                    <span>Total Nodes:</span>
                    <span>{metrics.health.totalNodes}</span>
                  </div>
                  <div className="health-item">
                    <span>Healthy Nodes:</span>
                    <Tag color="success">{metrics.health.healthyNodes}</Tag>
                  </div>
                  <div className="health-item">
                    <span>Unhealthy Nodes:</span>
                    <Tag color="error">{metrics.health.unhealthyNodes}</Tag>
                  </div>
                  <div className="health-details">
                    <h4>Node Details:</h4>
                    {Object.entries(metrics.health.nodes).map(([nodeId, nodeHealth]: [string, any]) => (
                      <div key={nodeId} className="node-health">
                        <span>{nodeId}:</span>
                        <Tag color={nodeHealth.status === 'healthy' ? 'success' : 'error'}>
                          {nodeHealth.status}
                        </Tag>
                        <small>({nodeHealth.region})</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Dashboard;
