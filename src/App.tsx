/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  AlertTriangle, 
  Info, 
  Play, 
  Code2, 
  History, 
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Loader2
} from "lucide-react";
import { scanSmartContract, type ScanResult, type Vulnerability } from "./lib/gemini";
import { cn } from "./lib/utils";

const SAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Insufficient balance");

        // VULNERABILITY: Reentrancy
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`;

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ code: string; result: ScanResult; date: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  const handleScan = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsScanning(true);
    setError(null);
    try {
      const scanResult = await scanSmartContract(code);
      setResult(scanResult);
      setHistory(prev => [{ code, result: scanResult, date: new Date().toLocaleString() }, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the contract. Please check your connection and try again.");
    } finally {
      setIsScanning(false);
    }
  }, [code]);

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SmartGuard</h1>
          <span className="text-[10px] uppercase tracking-widest bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">AI Auditor</span>
        </div>
        
        <nav className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab("editor")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "editor" ? "bg-accent/10 text-accent" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Code2 className="w-4 h-4" />
            Editor
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "history" ? "bg-accent/10 text-accent" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <History className="w-4 h-4" />
            History
            {history.length > 0 && (
              <span className="bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </nav>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === "editor" ? (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Left: Code Editor */}
            <div className="flex-1 flex flex-col border-r border-border p-6 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Code2 className="w-4 h-4" />
                  <span>Solidity Contract</span>
                </div>
                <button 
                  onClick={() => setCode(SAMPLE_CODE)}
                  className="text-xs text-accent hover:underline"
                >
                  Load Sample
                </button>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 code-editor resize-none"
                placeholder="Paste your Solidity code here..."
                spellCheck={false}
              />
              
              <button
                onClick={handleScan}
                disabled={isScanning || !code.trim()}
                className={cn(
                  "h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                  isScanning || !code.trim() 
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                    : "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 active:scale-[0.98]"
                )}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Security...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Run Security Audit
                  </>
                )}
              </button>
            </div>

            {/* Right: Results Dashboard */}
            <div className="flex-1 bg-black/20 overflow-y-auto p-6 flex flex-col gap-6">
              <AnimatePresence mode="wait">
                {isScanning ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                      <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Scanning Contract</h3>
                      <p className="text-gray-400 text-sm">Our AI is auditing your code for vulnerabilities...</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Score Card */}
                    <div className="glass rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold">Security Score</h2>
                        <p className="text-sm text-gray-400 max-w-xs">{result.summary}</p>
                      </div>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-gray-800"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 * (1 - result.overallScore / 100)}
                            className={cn(
                              "transition-all duration-1000 ease-out",
                              result.overallScore > 80 ? "text-low" : 
                              result.overallScore > 50 ? "text-medium" : "text-critical"
                            )}
                          />
                        </svg>
                        <span className="absolute text-2xl font-bold">{result.overallScore}</span>
                      </div>
                    </div>

                    {/* Vulnerabilities List */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Findings ({result.vulnerabilities.length})</h3>
                        <div className="flex gap-2">
                          <SeverityBadge severity="Critical" count={result.vulnerabilities.filter(v => v.severity === "Critical").length} />
                          <SeverityBadge severity="High" count={result.vulnerabilities.filter(v => v.severity === "High").length} />
                        </div>
                      </div>

                      {result.vulnerabilities.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center flex flex-col items-center gap-3">
                          <ShieldCheck className="text-low w-12 h-12" />
                          <p className="text-gray-300 font-medium">No vulnerabilities found!</p>
                          <p className="text-gray-500 text-sm">Your contract appears to follow security best practices.</p>
                        </div>
                      ) : (
                        result.vulnerabilities.map((vuln, idx) => (
                          <VulnerabilityCard key={idx} vulnerability={vuln} />
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-critical"
                  >
                    <AlertTriangle className="w-12 h-12" />
                    <div>
                      <h3 className="text-lg font-semibold">Audit Failed</h3>
                      <p className="text-gray-400 text-sm">{error}</p>
                    </div>
                    <button 
                      onClick={handleScan}
                      className="text-sm text-accent hover:underline"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-500">
                    <ShieldQuestion className="w-16 h-16 opacity-20" />
                    <div>
                      <h3 className="text-lg font-medium">Ready to Audit</h3>
                      <p className="text-sm max-w-xs">Paste your Solidity code and click "Run Security Audit" to begin the analysis.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Audit History</h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-sm text-critical hover:underline flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                  <History className="w-12 h-12 text-gray-600" />
                  <p className="text-gray-400">No previous audits found.</p>
                  <button 
                    onClick={() => setActiveTab("editor")}
                    className="text-accent hover:underline text-sm"
                  >
                    Start your first audit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="glass rounded-xl p-6 flex items-center justify-between hover:bg-card transition-all cursor-pointer group"
                      onClick={() => {
                        setCode(item.code);
                        setResult(item.result);
                        setActiveTab("editor");
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            item.result.overallScore > 80 ? "bg-low" : 
                            item.result.overallScore > 50 ? "bg-medium" : "bg-critical"
                          )} />
                          <h4 className="font-semibold">Audit from {item.date}</h4>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{item.result.summary}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{item.result.overallScore}</div>
                          <div className="text-[10px] uppercase text-gray-500">Score</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="h-10 border-t border-border flex items-center justify-between px-6 text-[10px] text-gray-500 uppercase tracking-widest bg-black/40">
        <div className="flex gap-4">
          <span>Powered by Gemini 3.1 Pro</span>
          <span>Solidity Security Engine v1.0</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-300 flex items-center gap-1">
            Documentation <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span>© 2026 SmartGuard</span>
        </div>
      </footer>
    </div>
  );
}

function SeverityBadge({ severity, count }: { severity: string; count: number }) {
  if (count === 0) return null;
  
  const colors = {
    Critical: "bg-critical/10 text-critical border-critical/20",
    High: "bg-high/10 text-high border-high/20",
    Medium: "bg-medium/10 text-medium border-medium/20",
    Low: "bg-low/10 text-low border-low/20",
    Info: "bg-info/10 text-info border-info/20",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5",
      colors[severity as keyof typeof colors]
    )}>
      {severity} ({count})
    </span>
  );
}

function VulnerabilityCard({ vulnerability }: { vulnerability: Vulnerability }) {
  const [isOpen, setIsOpen] = useState(false);

  const severityColors = {
    Critical: "text-critical",
    High: "text-high",
    Medium: "text-medium",
    Low: "text-low",
    Info: "text-info",
  };

  const severityIcons = {
    Critical: ShieldAlert,
    High: AlertTriangle,
    Medium: AlertTriangle,
    Low: Info,
    Info: Info,
  };

  const Icon = severityIcons[vulnerability.severity as keyof typeof severityIcons];

  return (
    <div className="glass rounded-xl overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-black/40", severityColors[vulnerability.severity as keyof typeof severityColors])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", severityColors[vulnerability.severity as keyof typeof severityColors])}>
                {vulnerability.severity}
              </span>
              {vulnerability.lineRange && (
                <span className="text-[10px] text-gray-500 font-mono">Lines {vulnerability.lineRange}</span>
              )}
            </div>
            <h4 className="font-semibold text-gray-200">{vulnerability.title}</h4>
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-border/50 bg-black/20 flex flex-col gap-4">
              <div className="mt-4">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</h5>
                <div className="text-sm text-gray-400 leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{vulnerability.description}</ReactMarkdown>
                </div>
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recommendation</h5>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-accent/90 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{vulnerability.recommendation}</ReactMarkdown>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <span className="px-1.5 py-0.5 bg-gray-800 rounded">Type: {vulnerability.vulnerabilityType}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

