"use client";

import { DatePicker, Modal } from "antd";
import dayjs from "dayjs";
import React from "react";
import type { DraftRecord, ImportResult, SeatType, TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, seatOptions } from "@/src/frontend/utils/travel";

type Props = {
  initialRecords: TravelRecord[];
};

export default function RecordManager({ initialRecords }: Props) {
  const [modal, contextHolder] = Modal.useModal();
  const [records, setRecords] = React.useState(initialRecords);
  const [draft, setDraft] = React.useState<DraftRecord>({
    date: "",
    train: "",
    from: "",
    to: "",
    seat: "二等座",
    seatNo: "",
    fare: "",
    remark: "",
  });
  const [editingRecord, setEditingRecord] = React.useState<TravelRecord | null>(null);
  const [editDraft, setEditDraft] = React.useState<DraftRecord>(createEmptyDraft());
  const [importText, setImportText] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);

  const sortedRecords = React.useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );
  const yearlyGroups = React.useMemo(() => groupRecordsByYear(sortedRecords), [sortedRecords]);

  function updateDraft<K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateEditDraft<K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) {
    setEditDraft((current) => ({ ...current, [key]: value }));
  }

  async function refreshRecords() {
    const nextRecords = await fetchJson<TravelRecord[]>("/api/records");
    setRecords(nextRecords);
  }

  async function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRecord = getDraftPayload(draft);
    modal.confirm({
      title: "确认添加这条记录？",
      content: `${nextRecord.date} · ${nextRecord.train} · ${nextRecord.from} → ${nextRecord.to}`,
      okText: "确认添加",
      cancelText: "取消",
      async onOk() {
        await createRecord(nextRecord);
      },
    });
  }

  async function createRecord(record: Omit<TravelRecord, "id">) {
    await fetchJson<TravelRecord>("/api/records", {
      method: "POST",
      body: JSON.stringify(record),
    });
    resetDraft();
    await refreshRecords();
  }

  function confirmDeleteRecord(record: TravelRecord) {
    modal.confirm({
      title: "确认删除这条记录？",
      content: `${record.date} · ${record.train} · ${record.from} → ${record.to}`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        await deleteRecord(record.id);
      },
    });
  }

  async function deleteRecord(id: string) {
    await fetchJson<{ deleted: number }>(`/api/records/${id}`, { method: "DELETE" });
    await refreshRecords();
  }

  function openEditRecord(record: TravelRecord) {
    setEditingRecord(record);
    setEditDraft(recordToDraft(record));
  }

  function closeEditRecord() {
    setEditingRecord(null);
    setEditDraft(createEmptyDraft());
  }

  function confirmUpdateRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRecord) return;
    const nextRecord = getDraftPayload(editDraft);
    modal.confirm({
      title: "确认保存这条记录？",
      content: `${nextRecord.date} · ${nextRecord.train} · ${nextRecord.from} → ${nextRecord.to}`,
      okText: "确认保存",
      cancelText: "取消",
      async onOk() {
        await updateRecord(editingRecord.id, nextRecord);
      },
    });
  }

  async function updateRecord(id: string, record: Omit<TravelRecord, "id">) {
    await fetchJson<TravelRecord>(`/api/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(record),
    });
    closeEditRecord();
    await refreshRecords();
  }

  async function importRecords() {
    const result = await fetchJson<ImportResult>("/api/records/import", {
      method: "POST",
      body: JSON.stringify({ text: importText }),
    });
    setImportResult(result);
    if (result.added > 0) {
      setImportText("");
      await refreshRecords();
    }
  }

  function resetDraft() {
    setDraft({
      date: "",
      train: "",
      from: "",
      to: "",
      seat: "二等座",
      seatNo: "",
      fare: "",
      remark: "",
    });
  }

  return (
    <div className="records-grid">
      {contextHolder}
      <section className="panel records-panel">
        <div className="panel-head">
          <div>
            <p className="section-label">新增记录</p>
            <h2>录入一次行程</h2>
          </div>
          <div className="chip">{sortedRecords.length} 条记录</div>
        </div>

        <form className="entry-form" onSubmit={addRecord}>
          <DatePicker
            className="travel-date-picker"
            value={draft.date ? dayjs(draft.date) : null}
            onChange={(_, dateString) => updateDraft("date", Array.isArray(dateString) ? dateString[0] : dateString)}
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: "HH:mm" }}
            placeholder="请选择出发时间"
            required
            allowClear
            inputReadOnly
            classNames={{ popup: { root: "travel-date-popup" } }}
          />
          <input
            aria-label="车次"
            type="text"
            required
            placeholder="车次"
            value={draft.train}
            onChange={(event) => updateDraft("train", event.target.value)}
          />
          <input
            aria-label="出发站"
            type="text"
            required
            placeholder="出发站"
            value={draft.from}
            onChange={(event) => updateDraft("from", event.target.value)}
          />
          <input
            aria-label="到达站"
            type="text"
            required
            placeholder="到达站"
            value={draft.to}
            onChange={(event) => updateDraft("to", event.target.value)}
          />
          <select
            aria-label="席别"
            value={draft.seat}
            onChange={(event) => updateDraft("seat", event.target.value as SeatType)}
          >
            {seatOptions.map((seat) => (
              <option key={seat}>{seat}</option>
            ))}
          </select>
          <input
            aria-label="座位号"
            type="text"
            placeholder="座位号"
            value={draft.seatNo}
            onChange={(event) => updateDraft("seatNo", event.target.value)}
          />
          <input
            aria-label="票价"
            type="number"
            min="0"
            step="0.5"
            required
            placeholder="票价"
            value={draft.fare}
            onChange={(event) => updateDraft("fare", event.target.value)}
            onBlur={() => {
              if (!draft.fare) return;
              const fare = Number(draft.fare);
              if (!Number.isNaN(fare)) updateDraft("fare", fare.toFixed(1));
            }}
          />
          <textarea
            className="remark-input"
            aria-label="备注"
            placeholder="备注"
            value={draft.remark}
            onChange={(event) => updateDraft("remark", event.target.value)}
          />
          <button className="primary-btn" type="submit">
            添加记录
          </button>
        </form>

        <section className="import-box">
          <div className="import-head">
            <div>
              <h3>批量导入</h3>
              <p>从语雀复制表格或多行文本粘贴到这里</p>
            </div>
            <button className="ghost-btn" type="button" onClick={importRecords} disabled={!importText.trim()}>
              导入
            </button>
          </div>
          <textarea
            aria-label="批量导入行程"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="支持：出发时间 车次 出发站 到达站 席别 座位号 票价 备注"
          />
          {importResult && (
            <p className="import-result">
              已导入 {importResult.added} 条，跳过 {importResult.skipped} 行
            </p>
          )}
        </section>

        <div className="panel-actions">
          <button className="primary-btn" type="button" onClick={() => window.print()}>
            打印车票
          </button>
        </div>
      </section>

      <section className="panel list-panel">
        <div className="panel-head">
          <div>
            <p className="section-label">行程列表</p>
            <h2>每次出行记录</h2>
          </div>
          <div className="chip">{sortedRecords.length} 条可见</div>
        </div>
        <div className="yearly-record-list">
          {yearlyGroups.map((group) => (
            <section className="year-group" key={group.year}>
              <div className="year-summary">
                <div>
                  <h3>{group.year} 年</h3>
                  <p>{group.records.length} 次出行</p>
                </div>
                <strong>{fmtMoney(group.totalFare)}</strong>
              </div>
              <div className="record-list">
                {group.records.map((record) => (
                  <article className="record" key={record.id}>
                    <div>
                      <strong>
                        {record.from} → {record.to}
                      </strong>
                      <div className="meta">{getRecordMeta(record)}</div>
                    </div>
                    <div className="price">{fmtMoney(record.fare)}</div>
                    <button
                      className="edit-btn"
                      type="button"
                      aria-label={`编辑 ${record.train}`}
                      onClick={() => openEditRecord(record)}
                    >
                      编辑
                    </button>
                    <button
                      className="delete-btn"
                      type="button"
                      aria-label={`删除 ${record.train}`}
                      onClick={() => confirmDeleteRecord(record)}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <Modal
        title="编辑历史记录"
        open={Boolean(editingRecord)}
        onCancel={closeEditRecord}
        footer={null}
        destroyOnHidden
      >
        <form className="edit-form" onSubmit={confirmUpdateRecord}>
          <RecordFields draft={editDraft} onChange={updateEditDraft} />
          <div className="modal-actions">
            <button className="ghost-btn" type="button" onClick={closeEditRecord}>
              取消
            </button>
            <button className="primary-btn" type="submit">
              保存修改
            </button>
          </div>
        </form>
      </Modal>

      <section className="panel ticket-panel tickets-wide">
        <div className="panel-head">
          <div>
            <p className="section-label">车票预览</p>
            <h2>逐条生成票面</h2>
          </div>
          <div className="chip">自动编号</div>
        </div>
        <TicketGrid records={sortedRecords} />
      </section>
    </div>
  );
}

function RecordFields({
  draft,
  onChange,
}: {
  draft: DraftRecord;
  onChange: <K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) => void;
}) {
  return (
    <>
      <DatePicker
        className="travel-date-picker"
        value={draft.date ? dayjs(draft.date) : null}
        onChange={(_, dateString) => onChange("date", Array.isArray(dateString) ? dateString[0] : dateString)}
        format="YYYY-MM-DD HH:mm"
        showTime={{ format: "HH:mm" }}
        placeholder="请选择出发时间"
        required
        allowClear
        inputReadOnly
        classNames={{ popup: { root: "travel-date-popup" } }}
      />
      <input
        aria-label="编辑车次"
        type="text"
        required
        placeholder="车次"
        value={draft.train}
        onChange={(event) => onChange("train", event.target.value)}
      />
      <input
        aria-label="编辑出发站"
        type="text"
        required
        placeholder="出发站"
        value={draft.from}
        onChange={(event) => onChange("from", event.target.value)}
      />
      <input
        aria-label="编辑到达站"
        type="text"
        required
        placeholder="到达站"
        value={draft.to}
        onChange={(event) => onChange("to", event.target.value)}
      />
      <select
        aria-label="编辑席别"
        value={draft.seat}
        onChange={(event) => onChange("seat", event.target.value as SeatType)}
      >
        {seatOptions.map((seat) => (
          <option key={seat}>{seat}</option>
        ))}
      </select>
      <input
        aria-label="编辑座位号"
        type="text"
        placeholder="座位号"
        value={draft.seatNo}
        onChange={(event) => onChange("seatNo", event.target.value)}
      />
      <input
        aria-label="编辑票价"
        type="number"
        min="0"
        step="0.5"
        required
        placeholder="票价"
        value={draft.fare}
        onChange={(event) => onChange("fare", event.target.value)}
        onBlur={() => {
          if (!draft.fare) return;
          const fare = Number(draft.fare);
          if (!Number.isNaN(fare)) onChange("fare", fare.toFixed(1));
        }}
      />
      <textarea
        className="remark-input"
        aria-label="编辑备注"
        placeholder="备注"
        value={draft.remark}
        onChange={(event) => onChange("remark", event.target.value)}
      />
    </>
  );
}

function TicketGrid({ records }: { records: TravelRecord[] }) {
  return (
    <div className="ticket-grid">
      {records.map((record, index) => (
        <article className="ticket" key={record.id}>
          <div className="ticket-top">
            <div>
              <p className="ticket-label">铁路电子客票</p>
              <h3 className="ticket-route">
                {record.from} - {record.to}
              </h3>
            </div>
            <div className="ticket-no">NO. {String(index + 1).padStart(2, "0")}</div>
          </div>
          <div className="ticket-body">
            <TicketMeta label="出发时间" value={record.date} />
            <TicketMeta label="车次" value={record.train} />
            <TicketMeta label="席别" value={record.seat} />
            <TicketMeta label="座位号" value={record.seatNo || "-"} />
            <TicketMeta label="票价" value={fmtMoney(record.fare)} />
          </div>
          <div className="ticket-footer">
            <div>
              <span className="label">出发</span>
              <strong>{record.from}</strong>
            </div>
            <div className="arrow">→</div>
            <div>
              <span className="label">到达</span>
              <strong>{record.to}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function getRecordMeta(record: TravelRecord) {
  return [record.date, record.train, record.seat, record.seatNo, record.remark].filter(Boolean).join(" · ");
}

function getDraftPayload(draft: DraftRecord): Omit<TravelRecord, "id"> {
  return {
    date: draft.date,
    train: draft.train.trim().toUpperCase(),
    from: draft.from.trim(),
    to: draft.to.trim(),
    seat: draft.seat,
    seatNo: draft.seatNo.trim(),
    fare: Number(Number(draft.fare).toFixed(1)),
    remark: draft.remark.trim(),
  };
}

function createEmptyDraft(): DraftRecord {
  return {
    date: "",
    train: "",
    from: "",
    to: "",
    seat: "二等座",
    seatNo: "",
    fare: "",
    remark: "",
  };
}

function recordToDraft(record: TravelRecord): DraftRecord {
  return {
    date: record.date,
    train: record.train,
    from: record.from,
    to: record.to,
    seat: record.seat,
    seatNo: record.seatNo || "",
    fare: record.fare.toFixed(1),
    remark: record.remark || "",
  };
}

function groupRecordsByYear(records: TravelRecord[]) {
  const groups = records.reduce<Record<string, TravelRecord[]>>((acc, record) => {
    const year = record.date.slice(0, 4);
    acc[year] = acc[year] || [];
    acc[year].push(record);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, yearRecords]) => ({
      year,
      records: yearRecords,
      totalFare: yearRecords.reduce((sum, record) => sum + record.fare, 0),
    }));
}

function TicketMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="ticket-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}
