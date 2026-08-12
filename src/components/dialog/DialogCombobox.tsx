import { Combobox } from "@base-ui-components/react/combobox";
import { ReactNode } from "react";
import { UnfoldMoreIcon } from "../icon/Icon";
import "./DialogCombobox.scss";

/**
 * The search a dialog is pointed at one of its subjects with.
 *
 * Fully controlled: both the choice and the text in the input are held by the
 * caller, so a subject arriving from outside can be taken without the combobox
 * being torn down and rebuilt around it.
 */
export default function DialogCombobox<T>({
  ariaLabel,
  placeholder,
  emptyMessage,
  items,
  filteredItems,
  value,
  onValueChange,
  query,
  onQueryChange,
  itemToStringLabel,
  itemKey,
  optionClassName,
  adornment,
  renderOption,
}: {
  ariaLabel: string;
  placeholder: string;
  /** Shown in place of the list where the query reaches nothing. */
  emptyMessage: string;
  items: Array<T>;
  filteredItems: Array<T>;
  value?: T;
  onValueChange: (chosen: T) => void;
  query: string;
  onQueryChange: (query: string) => void;
  itemToStringLabel: (item: T) => string;
  itemKey: (item: T) => string;
  optionClassName?: (item: T) => string;
  /** Held at the end of the input, saying something about what is chosen. */
  adornment?: ReactNode;
  renderOption: (item: T) => ReactNode;
}) {
  return (
    /*
      Typed on `T | null` rather than on `T`, because nothing is chosen until a
      subject arrives and a controlled combobox has to be handed something other
      than `undefined` from its first render.
    */
    <Combobox.Root<T | null>
      value={value ?? null}
      items={items}
      filteredItems={filteredItems}
      itemToStringLabel={(item: T | null) =>
        item != null ? itemToStringLabel(item) : ""
      }
      // Null arrives when the input is cleared to type another name. The dialog is
      // opened on a subject and answers for one from then on, so that clears the
      // search rather than the answer under it.
      onValueChange={(chosen: T | null) => {
        if (chosen != null) onValueChange(chosen);
      }}
      // Base UI writes the chosen label back through this on the way out, so
      // dismissing without picking anything restores it.
      inputValue={query}
      onInputValueChange={onQueryChange}
      // Tapping the search is the start of looking something else up, so what is
      // already in it goes rather than being deleted by hand. Only a press:
      // opening by typing reports `input-change`, and wiping that would take the
      // letters that opened the list.
      onOpenChange={(listOpen, details) => {
        if (listOpen && details.reason === "trigger-press") onQueryChange("");
      }}
      // The list is short and already on screen, so the first match being
      // highlighted saves an arrow key before Enter.
      autoHighlight
    >
      <div className="dialog__search">
        <Combobox.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="dialog__input"
        />
        {adornment}
        <Combobox.Icon className="dialog__input-icon">
          <UnfoldMoreIcon />
        </Combobox.Icon>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className="dialog__positioner" sideOffset={4}>
          <Combobox.Popup className="dialog__list">
            <Combobox.Empty className="dialog__empty">
              {emptyMessage}
            </Combobox.Empty>
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={itemKey(item)}
                  value={item}
                  className={`dialog__option ${optionClassName?.(item) ?? ""}`}
                >
                  {renderOption(item)}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
