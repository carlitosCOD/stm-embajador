import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import MenuSuperior from "../../../components/MenuSuperior/MenuSuperior";
import { useUsuarioContext } from "../../../contexts/UsuarioContext";
import usuarioDefault from "../../../assets/usuario.png";
import { API_URL } from "../../../config/api";
import verificadoIcon from "../../../assets/verificar.png";

const fotoToUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith("http")) {
    return `${fotoPath}?t=${Date.now()}`;
  }
  return `${API_URL.replace("/api", "")}/${fotoPath}?t=${Date.now()}`;
};

/* -------------------- FotoPanel -------------------- */
function FotoPanel({ onUploaded, editMode }) {
  const { usuario, setUsuario } = useUsuarioContext();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");

  const getAvatarURL = () => {
    if (preview) return preview;
    if (usuario?.foto_url) return fotoToUrl(usuario.foto_url);
    return usuarioDefault;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const img = new Image();
    img.src = URL.createObjectURL(f);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height);
      canvas.width = canvas.height = size;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        (img.width - size) / 2,
        (img.height - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], f.name, { type: f.type });
        setFile(croppedFile);
        setPreview(URL.createObjectURL(croppedFile));
      }, f.type);
    };
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("foto", file);

      const res = await axios.put(`${API_URL}/usuarios/perfil`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      setUsuario(prev => {
        const merged = { ...prev, ...data };
        localStorage.setItem("usuario", JSON.stringify(merged));
        return merged;
      });

      setFile(null);
      setPreview(null);
      if (onUploaded) onUploaded(data);
    } catch (err) {
      console.error("Error subiendo foto:", err);
      alert("Error subiendo la foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card card-header">
      <div className="card-info">
        <div className="card-avatar">
          <label className="avatar-editable" style={{ cursor: "pointer" }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={!editMode}
            />
            <img
              src={getAvatarURL()}
              alt="Foto de perfil"
              className="avatar-img-large clickable"
              onClick={() => {
                if (!editMode) setShowModal(true);
              }}
            />
          </label>
        </div>

        <div>
          <h2 className="card-name">
            {usuario?.nombre} {usuario?.apellido}
            {usuario?.verificado && (
              <img src={verificadoIcon} alt="Verificado" style={{ width: 24, height: 24 }} />
            )}
          </h2>
          <p className="card-role">{usuario?.informacion_adicional}</p>
        </div>
      </div>

      {editMode && file && (
        <div style={{ marginTop: 8 }}>
          <button className="btn-guardar" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir foto"}
          </button>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <img
            src={getAvatarURL()}
            alt="Vista previa"
            style={{
              maxWidth: "80%",
              maxHeight: "80%",
              borderRadius: "12px",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------- InfoPanel -------------------- */
function InfoPanel({ refreshKey, onUpdateContext, editMode, setEditMode }) {
  const { setUsuario } = useUsuarioContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  const fetchPerfil = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const perfil = res.data || {};
      setData(perfil);

      // ✅ FIX IMPORTANTE
      setUsuario(prev => {
        const merged = { ...prev, ...perfil };
        localStorage.setItem("usuario", JSON.stringify(merged));
        return merged;
      });

    } catch (err) {
      console.error("Error fetch perfil:", err);
    } finally {
      setLoading(false);
    }
  }, [token, setUsuario]);

  useEffect(() => {
    fetchPerfil();
  }, [fetchPerfil, refreshKey]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        correo_electronico: data.correo_electronico,
        numero_telefonico: data.numero_telefonico,
        informacion_adicional: data.informacion_adicional,
      };

      const res = await axios.put(`${API_URL}/usuarios/perfil`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = res.data || data;
      setData(updated);

      // ✅ FIX IMPORTANTE
      setUsuario(prev => {
        const merged = { ...prev, ...updated };
        localStorage.setItem("usuario", JSON.stringify(merged));
        return merged;
      });

      if (onUpdateContext) onUpdateContext(updated);
      setEditMode(false);

    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("Error guardando perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white text-center">Cargando perfil...</p>;
  if (!data) return <p>Error al cargar datos.</p>;

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>Información personal</h3>
        <button
          style={{ padding: "6px 12px", background: "#ffbf00", border: "none", borderRadius: 6, cursor: "pointer" }}
          onClick={() => editMode ? handleSave() : setEditMode(true)}
          disabled={saving}
        >
          {editMode ? (saving ? "Actualizando..." : "Actualizar") : "Editar"}
        </button>
      </div>

      <div className="info-grid">
        <label>Nombre</label>
        <input name="nombre" value={data.nombre || ""} onChange={handleChange} readOnly={!editMode} />

        <label>Apellido</label>
        <input name="apellido" value={data.apellido || ""} onChange={handleChange} readOnly={!editMode} />

        <label>Correo electrónico</label>
        <input name="correo_electronico" value={data.correo_electronico || ""} readOnly />

        <label>Teléfono</label>
        <input name="numero_telefonico" value={data.numero_telefonico || ""} onChange={handleChange} readOnly={!editMode} />

        <label>Información adicional</label>
        <input
          name="informacion_adicional"
          value={data.informacion_adicional || ""}
          onChange={handleChange}
          readOnly={!editMode}
          className="span-2"
        />
      </div>
    </div>
  );
}

/* -------------------- Perfil -------------------- */
export default function Perfil() {
  const { setUsuario } = useUsuarioContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const handleFotoSubida = (data) => {
    if (data) {
      setUsuario(prev => {
        const merged = { ...prev, ...data };
        localStorage.setItem("usuario", JSON.stringify(merged));
        return merged;
      });
    }
    setRefreshKey(k => k + 1);
  };

  const handleInfoUpdateContext = (data) => {
    if (data) {
      setUsuario(prev => {
        const merged = { ...prev, ...data };
        localStorage.setItem("usuario", JSON.stringify(merged));
        return merged;
      });
    }
  };

  return (
    <>
      <MenuSuperior />
      <div className="perfil-container">
        <main className="perfil-main" style={{ display: "grid", gap: 16 }}>
          <FotoPanel onUploaded={handleFotoSubida} editMode={editMode} />
          <InfoPanel
            refreshKey={refreshKey}
            onUpdateContext={handleInfoUpdateContext}
            editMode={editMode}
            setEditMode={setEditMode}
          />
        </main>
      </div>
    </>
  );
}
