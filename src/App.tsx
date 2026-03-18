import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Layers, Power, AlertCircle } from 'lucide-react';
import { InstanceCard } from './components/InstanceCard';
import { ConfirmModal } from './components/ConfirmModal';
import { CreateModal } from './components/CreateModal';
import { RenameModal } from './components/RenameModal';
import clsx from 'clsx';

function App() {
  const [instances, setInstances] = useState<WeChatInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWeChatInstalled, setIsWeChatInstalled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runningPaths, setRunningPaths] = useState<string[]>([]);

  // Rename Modal State
  const [renameState, setRenameState] = useState<{
    isOpen: boolean;
    instance: WeChatInstance | null;
  }>({
    isOpen: false,
    instance: null,
  });

  // Splash Screen State
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('正在启动...');

  const handleRename = async (newName: string) => {
    if (renameState.instance) {
      await window.ipcRenderer.invoke('wechat:rename', renameState.instance.path, newName);
      await checkAndScan(false);
    }
  };

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    confirmText: '确定',
    onConfirm: () => { },
  });

  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

  const checkAndScan = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const isInstalled = await window.ipcRenderer.invoke('wechat:check');
      setIsWeChatInstalled(isInstalled);
      if (isInstalled) {
        const found = await window.ipcRenderer.invoke('wechat:scan');
        setInstances(found);
      } else {
        setInstances([]);
      }
      const running = await window.ipcRenderer.invoke('wechat:running');
      setRunningPaths(running);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // Step 1: System Check
      setLoadingStatus('正在连接系统服务...');
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 2: WeChat Check
      setLoadingStatus('正在检测官方微信环境...');
      const isInstalled = await window.ipcRenderer.invoke('wechat:check');
      setIsWeChatInstalled(isInstalled);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 3: Scan Instances
      if (isInstalled) {
        setLoadingStatus('正在深度扫描分身数据...');
        const found = await window.ipcRenderer.invoke('wechat:scan');
        setInstances(found);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setInstances([]);
      }

      // Step 4: Sync Status
      setLoadingStatus('正在同步进程运行状态...');
      const running = await window.ipcRenderer.invoke('wechat:running');
      setRunningPaths(running);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Done
      setLoadingStatus('引擎准备就绪');
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsAppReady(true);
    };

    initApp();

    const interval = setInterval(() => checkAndScan(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (path: string) => {
    await window.ipcRenderer.invoke('wechat:launch', path);
    // Wait a bit and refresh
    setTimeout(() => checkAndScan(false), 2000);
  };

  const handleStop = async (path: string) => {
    setConfirmState({
      isOpen: true,
      title: '强制退出',
      message: '确定要强制退出这个微信实例吗？未保存的消息可能会丢失。',
      isDestructive: true,
      onConfirm: async () => {
        await window.ipcRenderer.invoke('wechat:stop', path);
        setTimeout(() => checkAndScan(true), 1000); // Silent refresh
      }
    });
  };

  const handleCreate = async (name: string, count: number) => {
    await window.ipcRenderer.invoke('wechat:create', name, count);
    await checkAndScan(false); // Refresh list, show loading
  };

  const handleDelete = async (path: string) => {
    setConfirmState({
      isOpen: true,
      title: '删除分身',
      message: '确定要删除这个分身吗？此操作将永久删除该应用副本，无法撤销。聊天记录取决于微信数据存储位置（通常独立于 App）。',
      isDestructive: true,
      onConfirm: async () => {
        await window.ipcRenderer.invoke('wechat:delete', path);
        await checkAndScan(false); // Refresh list, show loading
      }
    });
  };

  const handleKillAll = async () => {
    setConfirmState({
      isOpen: true,
      title: '关闭所有微信',
      message: '确定要强制关闭所有正在运行的微信进程吗？所有未保存的消息可能会丢失。',
      isDestructive: true,
      onConfirm: async () => {
        await window.ipcRenderer.invoke('wechat:killAll');
        await checkAndScan(false); // Refresh list, show loading
      }
    });
  };

  // Helper for summary
  const instanceCount = instances.filter(i => !i.isOriginal).length;

  if (!isAppReady) {
    return <SplashScreen status={loadingStatus} />;
  }

  return (
    <div className="h-screen w-full bg-[#1a1a1a] text-white font-sans selection:bg-green-500/30 flex overflow-hidden fade-in-enter">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 h-full overflow-y-auto min-w-0 relative z-10 custom-scrollbar">
        <div className="p-8 max-w-[1600px] mx-auto">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-green-500 rounded-xl shadow-lg shadow-green-500/20 shrink-0">
                <Layers size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">微信多开助手</h1>
                <p className="text-zinc-400 text-sm mb-2 truncate">WeChat Multi Manager</p>
                {isWeChatInstalled && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 text-xs text-zinc-400 border border-white/10 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                    已检测到官方微信及 <span className="text-white font-bold mx-1">{instanceCount}</span> 个分身
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {instanceCount > 0 && (
                <button
                  onClick={() => {
                    const original = instances.find(i => i.isOriginal);
                    const outdated = instances.filter(i => !i.isOriginal && i.version !== original?.version);
                    const isAllUpToDate = outdated.length === 0;

                    setConfirmState({
                      isOpen: true,
                      title: isAllUpToDate ? '当前无需更新' : '一键更新所有分身',
                      message: isAllUpToDate
                        ? `所有分身当前版本 (v${original?.version || '未知'}) 与官方版本一致，无需更新。若遇到问题，可选择强制重构建。`
                        : `检测到 ${outdated.length} 个分身版本与官方版本 (v${original?.version}) 不一致。此操作将保留您的分身名称和数据，仅升级内核。`,
                      isDestructive: false,
                      confirmText: isAllUpToDate ? '强制重构' : '立即更新',
                      onConfirm: async () => {
                        // Even if up-to-date, user might want to force rebuild to fix issues
                        await window.ipcRenderer.invoke('wechat:reconstructAll');
                        await checkAndScan(false); // Refresh list, show loading
                      }
                    });
                  }}
                  className="w-32 h-10 px-0 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 font-medium border border-blue-500/10 whitespace-nowrap shrink-0"
                  title="当官方微信更新后，点击此按钮同步更新所有分身"
                >
                  <RefreshCw size={18} />
                  一键更新
                </button>
              )}
              <button
                onClick={handleKillAll}
                className="w-32 h-10 px-0 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0"
              >
                <Power size={18} />
                关闭所有
              </button>
              <button
                onClick={() => checkAndScan(false)} // Explicitly show loading for manual refresh
                className={clsx(
                  "w-24 h-10 px-0 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0",
                  loading && "animate-pulse"
                )}
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                刷新
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-32 h-10 px-0 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0"
              >
                <Plus size={18} />
                创建分身
              </button>
            </div>
          </header>

          {/* Content */}
          {!isWeChatInstalled ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-500 mb-2">未检测到微信</h2>
              <p className="text-zinc-400 max-w-md">
                请确保您的 Mac 上已安装官方微信 (WeChat.app)，且位于 /Applications 目录下。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 pb-8">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.path}
                  instance={instance}
                  isRunning={runningPaths.includes(instance.path)}
                  onLaunch={handleLaunch}
                  onStop={handleStop}
                  onRename={(inst) => setRenameState({ isOpen: true, instance: inst })}
                  onDelete={handleDelete}
                />
              ))}

              {/* Add New Card (Empty State or quick access) */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-green-500/50 hover:bg-green-500/5 transition-all h-full min-h-[160px]"
              >
                <div className="p-4 rounded-full bg-zinc-800 text-zinc-500 group-hover:bg-green-500 text-green-500 transition-colors mb-3">
                  <Plus size={24} className="text-current" />
                </div>
                <span className="text-zinc-500 group-hover:text-green-500 font-medium">创建新分身</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <SideBar />

      {/* Modals */}


      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />

      <RenameModal
        isOpen={renameState.isOpen}
        currentName={renameState.instance?.name || ''}
        onClose={() => setRenameState({ isOpen: false, instance: null })}
        onRename={handleRename}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        isDestructive={confirmState.isDestructive}
        confirmText={confirmState.confirmText}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  );
}

function SplashScreen({ status }: { status: string }) {
  return (
    <div className="h-screen w-full bg-[#1a1a1a] flex flex-col items-center justify-center text-white font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-green-500/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <div className="z-10 flex flex-col items-center">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping-slow"></div>
          <div className="relative bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 shadow-2xl">
            <div className="text-green-500 animate-bounce-slow">
              <Layers size={48} />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6 tracking-tight">微信多开助手</h1>

        <div className="relative w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 animate-shimmer"></div>
        </div>

        <p className="text-zinc-400 text-sm font-medium animate-pulse">{status}</p>
      </div>

      <div className="absolute bottom-10 text-zinc-700 text-xs">
        Designed by 涤生Hack
      </div>
    </div>
  );
}

export default App;

function SideBar() {
  return (
    <div className="w-72 h-full border-l border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md p-6 flex flex-col items-center z-20 shrink-0">
      <div className="mt-4 mb-8 text-center shrink-0">
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-2">Author</h2>
        <p className="text-zinc-200 font-bold text-lg">涤生Hack</p>
        <p className="text-zinc-600 text-xs mt-1">独立开发者</p>
      </div>

      <div className="flex flex-col gap-8 w-full pb-8 overflow-y-auto custom-scrollbar flex-1">
        {/* Official Account */}
        <div className="flex flex-col items-center gap-3 group shrink-0">
          <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-lg transition-transform hover:scale-105 duration-300">
            <img src="微信公众号二维码.jpg" alt="公众号" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <span className="text-xs text-zinc-400 block font-medium group-hover:text-green-500 transition-colors">关注公众号</span>
            <span className="text-[10px] text-zinc-600">获取更多黑科技工具</span>
          </div>
        </div>

        <div className="w-full h-px bg-white/5 shrink-0" />

        {/* Sponsorship */}
        <div className="flex flex-col gap-6 w-full shrink-0">
          <p className="text-center text-xs text-zinc-500 font-medium">觉得好用？请我喝杯咖啡</p>

          <div className="flex flex-col gap-6 items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-lg hover:rotate-1 transition-transform duration-300">
                <img src="微信收款码.jpg" alt="微信赞助" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-zinc-500">微信扫码</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-lg hover:-rotate-1 transition-transform duration-300">
                <img src="支付宝收款码.jpg" alt="支付宝赞助" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-zinc-500">支付宝扫码</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 text-[10px] text-zinc-700 text-center w-full shrink-0">
        v1.0.0 &copy; 2026
      </div>
    </div>
  );
}
