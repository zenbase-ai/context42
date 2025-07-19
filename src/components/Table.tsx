/*
 * Modern implementation of ink-table
 *
 * Thanks to https://github.com/maticzav/ink-table/blob/master/src/index.tsx
 */

import { Box, Text } from "ink"
import { sha1 } from "object-hash"
import type React from "react"
import { useCallback, useMemo } from "react"

/* Table */

type Scalar = string | number | boolean | null | undefined

type ScalarDict = {
  [key: string]: Scalar
}

export type CellProps = React.PropsWithChildren<{ column: number }>

export type TableProps<T extends ScalarDict> = {
  /**
   * List of values (rows).
   */
  data: T[]
  /**
   * Columns that we should display in the table.
   */
  columns: (keyof T)[]
  /**
   * Cell padding.
   */
  padding: number
  /**
   * Custom widths for columns. If provided, text will be truncated to fit.
   */
  columnWidths?: Record<keyof T, number>
  /**
   * Header component.
   */
  header: (props: React.PropsWithChildren<{}>) => React.JSX.Element
  /**
   * Component used to render a cell in the table.
   */
  cell: (props: CellProps) => React.JSX.Element
  /**
   * Component used to render the skeleton of the table.
   */
  skeleton: (props: React.PropsWithChildren) => React.JSX.Element
}

/* Table */

const Table = <T extends ScalarDict>(props: Pick<TableProps<T>, "data"> & Partial<TableProps<T>>) => {
  /* Config */

  /**
   * Gets all keys used in data by traversing through the data.
   */
  const getDataKeys = useCallback((): (keyof T)[] => {
    const keys = new Set<keyof T>()

    // Collect all the keys.
    for (const data of props.data) {
      for (const key in data) {
        keys.add(key)
      }
    }

    return Array.from(keys)
  }, [props.data])

  /**
   * Merges provided configuration with defaults.
   */
  const getConfig = useMemo((): TableProps<T> => {
    return {
      data: props.data,
      columns: props.columns || getDataKeys(),
      padding: props.padding || 1,
      columnWidths: props.columnWidths,
      header: props.header || Header,
      cell: props.cell || Cell,
      skeleton: props.skeleton || Skeleton,
    }
  }, [
    props.data,
    props.columns,
    props.padding,
    props.columnWidths,
    props.header,
    props.cell,
    props.skeleton,
    getDataKeys,
  ])

  /**
   * Calculates the width of each column by finding
   * the longest value in a cell of a particular column.
   *
   * Returns a list of column names and their widths.
   */
  const getColumns = useMemo((): Column<T>[] => {
    const { columns, padding, columnWidths: widths } = getConfig

    const widthsMap: Column<T>[] = columns.map(key => {
      // Use custom width if provided
      if (widths && widths[key] !== undefined) {
        return {
          column: key,
          width: widths[key],
          key: String(key),
        }
      }

      // Calculate width automatically
      const header = String(key).length
      /* Get the width of each cell in the column */
      const data = props.data.map(data => {
        const value = data[key]

        if (value === undefined || value === null) return 0
        return String(value).length
      })

      const width = Math.max(...data, header) + padding * 2

      /* Construct a cell */
      return {
        column: key,
        width: width,
        key: String(key),
      }
    })

    return widthsMap
  }, [getConfig, props.data])

  /**
   * Returns a (data) row representing the headings.
   */
  const getHeadings = useMemo((): Partial<T> => {
    const { columns } = getConfig

    const headings: Partial<T> = columns.reduce((acc, column) => ({ ...acc, [column]: column }), {})

    return headings
  }, [getConfig])

  /* Rendering utilities */

  // The top most line in the table.
  const header = useMemo(
    () =>
      row<T>({
        cell: getConfig.skeleton,
        padding: getConfig.padding,
        skeleton: {
          component: getConfig.skeleton,
          // chars
          line: "─",
          left: "┌",
          right: "┐",
          cross: "┬",
        },
      }),
    [getConfig],
  )

  // The line with column names.
  const heading = useMemo(
    () =>
      row<T>({
        cell: getConfig.header,
        padding: getConfig.padding,
        skeleton: {
          component: getConfig.skeleton,
          // chars
          line: " ",
          left: "│",
          right: "│",
          cross: "│",
        },
      }),
    [getConfig],
  )

  // The line that separates rows.
  const separator = useMemo(
    () =>
      row<T>({
        cell: getConfig.skeleton,
        padding: getConfig.padding,
        skeleton: {
          component: getConfig.skeleton,
          // chars
          line: "─",
          left: "├",
          right: "┤",
          cross: "┼",
        },
      }),
    [getConfig],
  )

  // The row with the data.
  const data = useMemo(
    () =>
      row<T>({
        cell: getConfig.cell,
        padding: getConfig.padding,
        skeleton: {
          component: getConfig.skeleton,
          // chars
          line: " ",
          left: "│",
          right: "│",
          cross: "│",
        },
      }),
    [getConfig],
  )

  // The bottom most line of the table.
  const footer = useMemo(
    () =>
      row<T>({
        cell: getConfig.skeleton,
        padding: getConfig.padding,
        skeleton: {
          component: getConfig.skeleton,
          // chars
          line: "─",
          left: "└",
          right: "┘",
          cross: "┴",
        },
      }),
    [getConfig],
  )

  /* Render */

  /* Data */
  const columns = getColumns
  const headings = getHeadings

  /**
   * Render the table line by line.
   */
  return (
    <Box flexDirection="column">
      {/* Header */}
      {header({ key: "header", columns, data: {} })}
      {heading({ key: "heading", columns, data: headings })}
      {/* Data */}
      {props.data.map((row, index) => {
        // Calculate the hash of the row based on its value and position
        const key = `row-${sha1(row)}-${index}`

        // Construct a row.
        return (
          <Box flexDirection="column" key={key}>
            {separator({ key: `separator-${key}`, columns, data: {} })}
            {data({ key: `data-${key}`, columns, data: row })}
          </Box>
        )
      })}
      {/* Footer */}
      {footer({ key: "footer", columns, data: {} })}
    </Box>
  )
}

export default Table

/* Helper components */

type RowConfig = {
  /**
   * Component used to render cells.
   */
  cell: (props: CellProps) => React.JSX.Element
  /**
   * Tells the padding of each cell.
   */
  padding: number
  /**
   * Component used to render skeleton in the row.
   */
  skeleton: {
    component: (props: React.PropsWithChildren<{}>) => React.JSX.Element
    /**
     * Characters used in skeleton.
     *    |             |
     * (left)-(line)-(cross)-(line)-(right)
     *    |             |
     */
    left: string
    right: string
    cross: string
    line: string
  }
}

type RowProps<T extends ScalarDict> = {
  key: string
  data: Partial<T>
  columns: Column<T>[]
}

type Column<T> = {
  key: string
  column: keyof T
  width: number
}

/**
 * Constructs a Row element from the configuration.
 */
const row = <T extends ScalarDict>(config: RowConfig): ((props: RowProps<T>) => React.JSX.Element) => {
  /* This is a component builder. We return a function. */

  const skeleton = config.skeleton

  /* Row */
  return props => (
    <Box flexDirection="row">
      {/* Left */}
      <skeleton.component>{skeleton.left}</skeleton.component>
      {/* Data */}
      {...intersperse(
        i => {
          const key = `${props.key}-hseparator-${i}`

          // The horizontal separator.
          return <skeleton.component key={key}>{skeleton.cross}</skeleton.component>
        },

        // Values.
        props.columns.map((column, colI) => {
          // content
          const value = props.data[column.column]

          if (value === undefined || value === null) {
            const key = `${props.key}-empty-${column.key}`

            return (
              <config.cell key={key} column={colI}>
                {skeleton.line.repeat(column.width)}
              </config.cell>
            )
          }
          const key = `${props.key}-cell-${column.key}`

          // Truncate text if it's too long for the column
          const originalText = String(value)
          const truncatedText = truncateText(originalText, column.width, config.padding)

          // margins
          const ml = config.padding
          const mr = column.width - truncatedText.length - config.padding

          return (
            /* prettier-ignore */
            <config.cell key={key} column={colI}>
              {`${skeleton.line.repeat(ml)}${truncatedText}${skeleton.line.repeat(mr)}`}
            </config.cell>
          )
        }),
      )}
      {/* Right */}
      <skeleton.component>{skeleton.right}</skeleton.component>
    </Box>
  )
}

/**
 * Renders the header of a table.
 */
export const Header = (props: React.PropsWithChildren) => (
  <Text bold color="blue">
    {props.children}
  </Text>
)

/**
 * Renders a cell in the table.
 */
export const Cell = (props: CellProps) => <Text>{props.children}</Text>

/**
 * Renders the scaffold of the table.
 */
export const Skeleton = (props: React.PropsWithChildren) => <Text bold>{props.children}</Text>

/* Utility functions */

/**
 * Truncates text to fit within specified width, adding ellipsis if needed.
 */
const truncateText = (text: string, maxWidth: number, padding: number): string => {
  const availableWidth = maxWidth - padding * 2
  if (text.length <= availableWidth) return text
  if (availableWidth <= 3) return "...".slice(0, availableWidth)
  return `${text.slice(0, availableWidth - 3)}...`
}

/**
 * Intersperses a list of elements with another element.
 */
const intersperse = <T, I>(intersperser: (index: number) => I, elements: T[]): (T | I)[] =>
  // Intersperse by reducing from left.
  elements.reduce(
    (acc, element, index) => {
      // Only add element if it's the first one.
      if (acc.length === 0) return [element]
      // Add the intersparser as well otherwise.
      acc.push(intersperser(index), element)
      return acc
    },
    [] as (T | I)[],
  )
