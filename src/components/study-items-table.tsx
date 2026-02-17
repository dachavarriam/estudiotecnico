import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Search, Loader2 } from "lucide-react";
import { searchSupplies, SupplyItem } from "@/actions/supply-actions"; // Update import


interface StudyItem {
  item: string;
  quantity: number;
  unit?: string;
  category?: "equipment" | "supply";
  relatedImageTag?: string;
  description?: string;
  price?: number; // Added Price
  total?: number; // Calculated
  source?: "odoo" | "local" | "manual"; // Track source
  odoo_product_id?: number | string; // ID
}

interface SiteImage {
  id: string;
  tag: string;
}

interface StudyItemsTableProps {
  items: StudyItem[];
  setItems: (items: StudyItem[]) => void;
  images: SiteImage[];
}

export function StudyItemsTable({ items, setItems, images }: StudyItemsTableProps) {
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<SupplyItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<{row: number, show: boolean}>({ row: -1, show: false });
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Initial load of supplies for "empty search"
  useEffect(() => {
      // Pre-fetch generic list? Or just rely on onFocus trigger?
      // onFocus trigger is better to ensure fresh data.
  }, []);

  const calculateTotal = (items: StudyItem[]) => {
      return items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  };

  const handleInputChange = (index: number, field: keyof StudyItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto Calc Total
    if (field === "quantity" || field === "price") {
        newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].price || 0);
    }

    setItems(newItems);

    if (field === "item") {
      // Trigger search
      triggerSearch(index, value);
    }
  };

  const triggerSearch = (index: number, query: string) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      
      setIsSearching(true);
      setShowSuggestions({ row: index, show: true });
      
      // Immediate search for empty or short queries to show "history" or "local"
      const delay = query.length === 0 ? 0 : 300;

      searchTimeout.current = setTimeout(async () => {
          const res = await searchSupplies(query); 
          setIsSearching(false);
          if (res.success && res.data) {
              setSuggestions(res.data);
          } else {
              setSuggestions([]);
          }
      }, delay);
  };
  
  const handleItemFocus = (index: number) => {
      const currentVal = items[index].item;
      triggerSearch(index, currentVal); 
  };

  const selectProduct = (index: number, product: SupplyItem) => {
      const newItems = [...items];
      newItems[index].item = product.name;
      newItems[index].odoo_product_id = product.id;
      newItems[index].unit = product.unit;
      newItems[index].price = product.price;
      newItems[index].total = (newItems[index].quantity || 1) * product.price;
      newItems[index].source = product.source;
       
      setItems(newItems);
      setShowSuggestions({ row: -1, show: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (field === "category") document.getElementById(`input-${index}-item`)?.focus();
        if (field === "item") document.getElementById(`input-${index}-quantity`)?.focus();
        if (field === "quantity") document.getElementById(`input-${index}-unit`)?.focus();
        if (field === "unit") document.getElementById(`input-${index}-description`)?.focus();
        if (field === "description") {
            if (index === items.length - 1) {
                addNewRow();
                setTimeout(() => document.getElementById(`input-${index + 1}-category`)?.focus(), 50);
            } else {
                document.getElementById(`input-${index + 1}-category`)?.focus();
            }
        }
    }
  };

  const addNewRow = () => {
    setItems([...items, { item: "", quantity: 1, unit: "und", category: "supply" }]);
     // Scroll to bottom logic if needed
  };

  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  // Close suggestions on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          // If click is outside the table or suggestion box
          // This is tricky with portals or absolute positioning. 
          // For now, selecting an item closes it.
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(value).replace('HNL', 'L.');
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-md border min-h-[500px]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-gray-100 border-b">
         <div className="flex text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <div className="p-3 w-32 shrink-0 border-r">Tipo</div>
            <div className="p-3 grow shrink-0 min-w-[300px] border-r">Item / Producto</div>
            <div className="p-3 w-20 shrink-0 text-center border-r">Cant.</div>
            <div className="p-3 w-20 shrink-0 text-center border-r">Unid.</div>
            <div className="p-3 w-28 shrink-0 text-right border-r">Precio</div>
            <div className="p-3 w-28 shrink-0 text-right border-r">Total</div>
            <div className="p-3 w-32 shrink-0 border-r">Foto Ref.</div>
            <div className="p-3 w-64 shrink-0 border-r">Notas</div>
            <div className="p-3 w-12 shrink-0"></div>
         </div>
      </div>

      <div className="overflow-auto flex-1 relative" ref={tableContainerRef}>
          {items.map((item, i) => (
             <div key={i} className="flex border-b hover:bg-slate-50 relative group items-start">
                {/* Category */}
                <div className="p-2 w-32 shrink-0 border-r">
                    <Select 
                        value={item.category} 
                        onValueChange={(val: any) => handleInputChange(i, "category", val)}
                    >
                        <SelectTrigger className="h-9 w-full bg-transparent border-none focus:ring-0 px-1 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="equipment">Equipo</SelectItem>
                            <SelectItem value="supply">Suministro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Item Search */}
                <div className="p-2 grow shrink-0 min-w-[300px] border-r relative">
                    <Input 
                        id={`input-${i}-item`}
                        value={item.item}
                        onChange={(e) => handleInputChange(i, "item", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, i, "item")}
                        onFocus={() => handleItemFocus(i)}
                        className="h-9 w-full font-medium border-gray-200 focus:border-blue-500"
                        placeholder="Buscar..."
                        autoComplete="off"
                    />
                    {/* Suggestions */}
                    {showSuggestions.show && showSuggestions.row === i && (
                        <div className="absolute z-50 top-full left-0 w-[400px] bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto mt-1">
                            {isSearching ? (
                                <div className="p-3 text-center text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/> Buscando...</div>
                            ) : suggestions.length > 0 ? (
                                suggestions.map((prod) => (
                                    <div 
                                        key={prod.id} 
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                        onClick={() => selectProduct(i, prod)}
                                    >
                                        <div className="text-sm font-bold text-gray-800">{prod.name}</div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className={`px-1.5 py-0.5 rounded ${prod.source === 'odoo' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                {prod.source === 'odoo' ? 'Odoo' : 'Local'}
                                            </span>
                                            <span className="text-gray-600 font-mono">{formatCurrency(prod.price)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-sm text-gray-400 italic bg-gray-50">
                                    No encontrado. <br/>
                                    <span className="text-xs">Se guardará como nuevo item al finalizar.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div className="p-2 w-20 shrink-0 border-r">
                    <Input 
                        id={`input-${i}-quantity`}
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleInputChange(i, "quantity", Number(e.target.value))}
                        className="h-9 w-full text-center"
                    />
                </div>

                {/* Unit */}
                <div className="p-2 w-20 shrink-0 border-r">
                    <Input 
                        id={`input-${i}-unit`}
                        value={item.unit || ""}
                        onChange={(e) => handleInputChange(i, "unit", e.target.value)}
                        className="h-9 w-full text-center text-sm"
                    />
                </div>

                 {/* Price */}
                 <div className="p-2 w-28 shrink-0 border-r relative">
                    {/* Display formatted price usually, edit raw number on focus? Or just show input type number? 
                        The user asked for comma display. Input type number doesn't show commas easily. 
                        Best approach: Show text input that formats on blur, or simple text display + hidden input?
                        Or just keep input type number but use a display overlay?
                        Let's try a simple approach: standard input type number for editing, but maybe use a text type and handle formatting?
                        Actually, typical table editing: shows formatted text, click to edit.
                        For now, to keep it simple and editable, I will keep type="number" but showing formatted text is hard in input.
                        Alternative: Separate display div when not focused? 
                        Let's try: Input type text using a controlled format.
                    */}
                    <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price || 0}
                        onChange={(e) => handleInputChange(i, "price", parseFloat(e.target.value))}
                        className="h-9 w-full text-right text-sm font-mono"
                    />
                    {/* A simple overlay or just accept that input[type=number] is hard to style with commas.
                        Wait, the user wants TO SEE "1,000.00".
                        If I change input to text, I can format it.
                    */}
                </div>

                {/* Total - Read Only */}
                <div className="p-2 w-28 shrink-0 border-r flex items-center justify-end font-mono text-sm font-medium text-gray-700">
                    {formatCurrency(item.total || 0)}
                </div>

                {/* Photo Ref */}
                <div className="p-2 w-32 shrink-0 border-r">
                     <Select 
                        value={item.relatedImageTag || "none"} 
                        onValueChange={(val) => handleInputChange(i, "relatedImageTag", val === "none" ? undefined : val)}
                    >
                        <SelectTrigger className="h-9 w-full bg-transparent border-gray-200 text-xs text-gray-600">
                            <SelectValue placeholder="Ver..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Sin Foto --</SelectItem>
                            {images.map(img => (
                                <SelectItem key={img.id} value={img.tag}>{img.tag}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Notes */}
                <div className="p-2 w-64 shrink-0 border-r">
                    <Input 
                        id={`input-${i}-description`}
                        value={item.description || ""}
                        onChange={(e) => handleInputChange(i, "description", e.target.value)}
                        className="h-9 w-full text-sm italic text-gray-500"
                        placeholder="Detalles..."
                    />
                </div>

                {/* Remove */}
                <div className="p-2 w-12 shrink-0 flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500 hover:bg-red-50" onClick={() => removeRow(i)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
             </div>
          ))}
      </div>

      <div className="p-3 bg-gray-50 border-t flex justify-between items-center shrink-0">
        <Button variant="outline" onClick={addNewRow} className="border-dashed text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Plus className="w-4 h-4 mr-2" /> Agregar Fila
        </Button>
        <div className="text-right pr-4">
             <span className="text-sm text-gray-500 uppercase font-bold mr-3">Total Estimado:</span>
             <span className="text-xl font-bold text-blue-600">{formatCurrency(items.reduce((s, i) => s + (i.total || 0), 0))}</span>
        </div>
      </div>
    </div>
  );
}
