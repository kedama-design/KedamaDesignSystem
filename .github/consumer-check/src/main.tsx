// 3つの export 先すべてを消費側の視点で使う
import '@kedama-design/design-system/styles';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ThemeProvider,
  ThemeToggle,
  IconSwap,
  RollingText,
  Drawer,
  DrawerContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Spinner,
  Toaster,
  toast,
  cn,
} from '@kedama-design/design-system';
import {
  semanticColors,
  elevation,
  spacing,
  semanticMotion,
} from '@kedama-design/design-system/tokens';
import type { ThemeSetting, ButtonProps } from '@kedama-design/design-system';

const variant: ButtonProps['variant'] = 'primary';
const choice: ThemeSetting = 'system';

export function App() {
  return (
    <ThemeProvider defaultTheme={choice}>
      <div className={cn('p-4')} style={{ gap: spacing[4] }}>
        <ThemeToggle />
        <Button variant={variant}>保存</Button>
        <Badge variant="accent">選択中</Badge>
        <Card>
          <CardHeader>
            <CardTitle>見出し</CardTitle>
          </CardHeader>
          <CardContent>
            <RollingText text="公開済み" />
            <IconSwap active base={<i />} swap={<i />} />
            <Skeleton className="h-4 w-32" />
            <Spinner />
          </CardContent>
        </Card>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>セル</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Drawer open={false}>
          <DrawerContent>x</DrawerContent>
        </Drawer>
        <Toaster />
        <button onClick={() => toast.add({ title: 'ok' })}>通知</button>
      </div>
    </ThemeProvider>
  );
}

// トークンが値として読めること
console.log(
  semanticColors.fg.default,
  elevation.overlay,
  semanticMotion['value-change'].tween.duration,
);
