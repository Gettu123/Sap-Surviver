import React, { useState } from 'react';
import { X, Copy, Check, Download, Code, Layers, Settings, FileCode, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UNITY_SCRIPTS = [
  {
    name: 'PlayerController.cs',
    title: 'Control del Key User',
    description: 'Controla el movimiento horizontal del Key User, clamping lateral en [-8f, 8f], y disparo continuo con cooldown.',
    code: `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 8f;
    public GameObject bulletPrefab;
    public Transform firePoint;
    public float fireRate = 0.2f;
    private float nextFireTime = 0f;
    private Rigidbody2D rb;
    private Vector2 movement;

    void Start() {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update() {
        movement.x = Input.GetAxisRaw("Horizontal");
        if (Input.GetButton("Jump") && Time.time >= nextFireTime) {
            Shoot();
            nextFireTime = Time.time + fireRate;
        }
    }

    void FixedUpdate() {
        rb.MovePosition(rb.position + movement * speed * Time.fixedDeltaTime);
        Vector2 clampedPos = rb.position;
        clampedPos.x = Mathf.Clamp(clampedPos.x, -8f, 8f);
        rb.position = clampedPos;
    }

    void Shoot() {
        Instantiate(bulletPrefab, firePoint.position, firePoint.rotation);
    }
}`
  },
  {
    name: 'Bullet.cs',
    title: 'Lógica de los proyectiles',
    description: 'Mueve el proyectil hacia arriba a 12f, detecta impacto con enemigos vía OnTriggerEnter2D e inflige daño.',
    code: `using UnityEngine;

public class Bullet : MonoBehaviour
{
    public float speed = 12f;
    public int damage = 1;

    void Update() {
        transform.Translate(Vector2.up * speed * Time.deltaTime);
        if (transform.position.y > 6f) Destroy(gameObject);
    }

    void OnTriggerEnter2D(Collider2D hitInfo) {
        Enemy enemy = hitInfo.GetComponent<Enemy>();
        if (enemy != null) {
            enemy.TakeDamage(damage);
            Destroy(gameObject);
        }
    }
}`
  },
  {
    name: 'Enemy.cs',
    title: 'Bugs y Chamados',
    description: 'Comportamiento de los incidentes que descienden a 3f. Si sobrepasan la pantalla inferior (-6f), restan vida a la folha.',
    code: `using UnityEngine;

public class Enemy : MonoBehaviour
{
    public float speed = 3f;
    public int health = 3;
    public int scoreValue = 100;

    void Update() {
        transform.Translate(Vector2.down * speed * Time.deltaTime);
        if (transform.position.y < -6f) {
            GameManager.Instance.LoseHealth(1);
            Destroy(gameObject);
        }
    }

    public void TakeDamage(int damage) {
        health -= damage;
        if (health <= 0) Die();
    }

    void Die() {
        GameManager.Instance.AddScore(scoreValue);
        Destroy(gameObject);
    }
}`
  },
  {
    name: 'SpawnManager.cs',
    title: 'Generador de problemas SAP',
    description: 'Genera oleadas de chamados e incidentes aleatorios en la parte superior con InvokeRepeating a cada 1.5s.',
    code: `using UnityEngine;

public class SpawnManager : MonoBehaviour
{
    public GameObject[] enemyPrefabs;
    public float spawnInterval = 1.5f;
    public float xRange = 8f;

    void Start() {
        InvokeRepeating("SpawnEnemy", 1f, spawnInterval);
    }

    void SpawnEnemy() {
        int index = Random.Range(0, enemyPrefabs.Length);
        Vector2 pos = new Vector2(Random.Range(-xRange, xRange), 6f);
        Instantiate(enemyPrefabs[index], pos, Quaternion.identity);
    }
}`
  },
  {
    name: 'GameManager.cs',
    title: 'Controlador principal',
    description: 'Singleton que gestiona el puntaje, vidas, actualización de UI y pantalla de Game Over.',
    code: `using UnityEngine;
using UnityEngine.UI;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;
    public int score = 0;
    public int health = 3;
    public Text scoreText;
    public Text healthText;
    public GameObject gameOverPanel;

    private void Awake() {
        if (Instance == null) Instance = this; else Destroy(gameObject);
    }

    public void AddScore(int amount) {
        score += amount;
        UpdateUI();
    }

    public void LoseHealth(int amount) {
        health -= amount;
        UpdateUI();
        if (health <= 0) GameOver();
    }

    void UpdateUI() {
        if(scoreText != null) scoreText.text = "PONTOS: " + score;
        if(healthText != null) healthText.text = "VIDAS: " + health;
    }

    void GameOver() {
        Time.timeScale = 0f;
        gameOverPanel.SetActive(true);
    }
}`
  }
];

export const UnityGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'setup' | 'editor'>('scripts');
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentScript = UNITY_SCRIPTS[selectedScriptIndex];

  const handleCopyCode = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedScript(name);
      setTimeout(() => setCopiedScript(null), 2000);
    } catch {}
  };

  const handleDownloadScript = (script: typeof UNITY_SCRIPTS[0]) => {
    const blob = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0a1829] border border-[#2b5170] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.85)] text-[#edf7ff] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1b3b55] bg-[#0c1f33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35e0d0] to-[#b88cff] text-[#061421] font-bold flex items-center justify-center text-xl shadow-[0_0_20px_rgba(53,224,208,0.4)]">
              <Code size={22} className="text-[#07111f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Chakra_Petch'] text-white">
                  SAP SURVIVOR: Guía de Motor Unity (C#)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#35e0d0]/20 text-[#35e0d0] border border-[#35e0d0]/30 font-bold uppercase">
                  Arquitetura Oficial
                </span>
              </div>
              <p className="text-xs text-[#8ca8bf] font-mono">
                Documentação técnica de física, scripts em C# e conexão no editor Unity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8ca8bf] hover:text-white hover:bg-[#16334d] rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1b3b55] bg-[#071424] px-4 gap-2 text-xs font-['Chakra_Petch'] font-bold">
          <button
            onClick={() => setActiveTab('scripts')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'scripts'
                ? 'border-[#35e0d0] text-[#35e0d0] bg-[#0f243a]'
                : 'border-transparent text-[#7e9cb6] hover:text-white'
            }`}
          >
            <FileCode size={15} /> 2. Scripts C# do Motor ({UNITY_SCRIPTS.length})
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'setup'
                ? 'border-[#35e0d0] text-[#35e0d0] bg-[#0f243a]'
                : 'border-transparent text-[#7e9cb6] hover:text-white'
            }`}
          >
            <Settings size={15} /> 1. Configuración del Proyecto
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'border-[#35e0d0] text-[#35e0d0] bg-[#0f243a]'
                : 'border-transparent text-[#7e9cb6] hover:text-white'
            }`}
          >
            <Layers size={15} /> 3. Conexión en el Editor
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#081728]">
          {activeTab === 'scripts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
              {/* Script selector sidebar */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[11px] font-mono text-[#8ca8bf] uppercase tracking-wider block mb-2">
                  ARQUIVOS C# (Unity Engine):
                </span>
                {UNITY_SCRIPTS.map((script, idx) => {
                  const isSelected = idx === selectedScriptIndex;
                  return (
                    <button
                      key={script.name}
                      onClick={() => setSelectedScriptIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'border-[#35e0d0] bg-[#122e47] shadow-[0_0_15px_rgba(53,224,208,0.2)]'
                          : 'border-[#1b3850] bg-[#0a1b2d] hover:border-[#2d567a] hover:bg-[#0e243b]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white">
                          {script.name}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#35e0d0] animate-pulse" />
                        )}
                      </div>
                      <span className="text-[11px] font-['Chakra_Petch'] text-[#8ca8bf]">
                        {script.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Code viewer */}
              <div className="lg:col-span-8 flex flex-col rounded-xl border border-[#1f4364] bg-[#050f1a] overflow-hidden shadow-inner">
                {/* Code header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d2238] border-b border-[#1b3b55]">
                  <div>
                    <strong className="font-mono text-xs text-[#35e0d0]">
                      {currentScript.name}
                    </strong>
                    <span className="text-[11px] text-[#8ca8bf] ml-2 font-['Chakra_Petch']">
                      — {currentScript.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadScript(currentScript)}
                      className="px-2.5 py-1 rounded bg-[#13304d] hover:bg-[#1a4066] text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Baixar arquivo .cs"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Baixar .cs</span>
                    </button>
                    <button
                      onClick={() => handleCopyCode(currentScript.code, currentScript.name)}
                      className="px-2.5 py-1 rounded bg-[#1e4870] hover:bg-[#285d8e] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedScript === currentScript.name ? (
                        <>
                          <Check size={13} className="text-[#c7ff62]" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 py-2 bg-[#091829] border-b border-[#163048] text-xs text-[#9eb6cc]">
                  {currentScript.description}
                </div>

                {/* Preformatted Code */}
                <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-[#d7e9f7]">
                  <pre className="select-text whitespace-pre">
                    <code>{currentScript.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-[#0b1f33] border border-[#1e4264] rounded-xl p-5">
                <h3 className="font-['Chakra_Petch'] font-bold text-base text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#35e0d0]" /> 1. Configuración del Proyecto en Unity
                </h3>
                <ul className="space-y-3 text-xs text-[#a3bed6] leading-relaxed list-disc list-inside">
                  <li>
                    Abre <b>Unity Hub</b> y crea un nuevo proyecto con la plantilla <b>2D Core</b>.
                  </li>
                  <li>
                    En la ventana <b>Hierarchy</b>, crea los siguientes elementos vacíos (<code className="px-1.5 py-0.5 rounded bg-[#071320] text-[#c7ff62]">Create Empty</code>):
                    <div className="ml-6 mt-1 flex gap-2">
                      <span className="font-mono text-white font-bold bg-[#142e47] px-2 py-1 rounded">GameManager</span>
                      <span className="font-mono text-white font-bold bg-[#142e47] px-2 py-1 rounded">SpawnManager</span>
                    </div>
                  </li>
                  <li>
                    Crea los siguientes <b>Prefabs</b> arrastrando sprites a la escena y luego a la carpeta de proyecto:
                    <div className="mt-2 space-y-2 ml-4">
                      <div className="p-2.5 rounded-lg bg-[#071320] border border-[#1b354e]">
                        <strong className="text-[#35e0d0] font-mono">Player:</strong> Sprite con <code className="text-[#c7ff62]">BoxCollider2D</code> y <code className="text-[#c7ff62]">Rigidbody2D</code> (Gravity Scale = 0). Tag: <code className="text-white">"Player"</code>.
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#071320] border border-[#1b354e]">
                        <strong className="text-[#ff5d6c] font-mono">Enemy:</strong> Sprite con <code className="text-[#c7ff62]">BoxCollider2D</code> (Is Trigger = true) y <code className="text-[#c7ff62]">Rigidbody2D</code>. Tag: <code className="text-white">"Enemy"</code>.
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#071320] border border-[#1b354e]">
                        <strong className="text-[#c7ff62] font-mono">Bullet:</strong> Sprite con <code className="text-[#c7ff62]">BoxCollider2D</code> (Is Trigger = true) y <code className="text-[#c7ff62]">Rigidbody2D</code>.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="max-w-3xl space-y-4">
              <div className="bg-[#0b1f33] border border-[#1e4264] rounded-xl p-5 space-y-4 text-xs text-[#a3bed6] leading-relaxed">
                <h3 className="font-['Chakra_Petch'] font-bold text-base text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#c7ff62]" /> 3. Conexión en el Editor de Unity
                </h3>

                <div className="p-3.5 rounded-xl bg-[#071320] border border-[#1b3650]">
                  <h4 className="font-['Chakra_Petch'] font-bold text-sm text-white mb-1">
                    El Jugador (Key User)
                  </h4>
                  <p>
                    Arrastra <code className="text-[#35e0d0]">PlayerController</code> al objeto <b>Player</b>. Crea un objeto vacío hijo llamado <code className="text-[#c7ff62]">"FirePoint"</code> y asígnalo en el inspector del script. Asigna tu prefab <code className="text-white">Bullet</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#071320] border border-[#1b3650]">
                  <h4 className="font-['Chakra_Petch'] font-bold text-sm text-white mb-1">
                    El Generador (SpawnManager)
                  </h4>
                  <p>
                    Arrastra <code className="text-[#35e0d0]">SpawnManager</code> al objeto vacío de la escena. Aumenta el tamaño de la lista de prefabs y asigna tus distintos enemigos (Chamados, Bugs).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#071320] border border-[#1b3650]">
                  <h4 className="font-['Chakra_Petch'] font-bold text-sm text-white mb-1">
                    La Interfaz (UI Canvas)
                  </h4>
                  <p>
                    Crea un Canvas (<code className="text-[#c7ff62]">UI -&gt; Canvas</code>), añade textos para puntos y vidas, y un panel de <b>Game Over</b>. Asígnalos al script <code className="text-[#35e0d0]">GameManager</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#1b3b55] bg-[#0c1f33]">
          <span className="text-[11px] font-mono text-[#7698b4]">
            Origem: Guia Técnico SAP SURVIVOR • Compatível com Unity 2022+ e WebGL
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#142f47] hover:bg-[#1a3d5e] text-white font-['Chakra_Petch'] text-xs font-bold transition-all cursor-pointer"
          >
            FECHAR GUIA
          </button>
        </div>
      </div>
    </div>
  );
};
